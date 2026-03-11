/**
 * SummariesService Unit Tests
 *
 * Uses Jest mocks for repositories and queue.
 * No in-memory implementations, no database dependencies.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';

import { SummariesService } from './summaries.service';
import { SummaryStatus } from './entities/candidate-summary.entity';
import { CANDIDATE_REPOSITORY, SUMMARY_REPOSITORY } from '../common/repositories/interfaces';
import { ICandidateRepository, ISummaryRepository } from '../common/interfaces';
import { SUMMARY_QUEUE, SUMMARY_JOB, SUMMARY_JOB_OPTIONS } from './queue.constants';

// ---------------------------------------------------------------------------
// Mock Factories
// ---------------------------------------------------------------------------
const createMockCandidateRepository = (): jest.Mocked<ICandidateRepository> => ({
  findByIdAndWorkspace: jest.fn(),
});

const createMockSummaryRepository = (): jest.Mocked<ISummaryRepository> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByCandidateId: jest.fn(),
  findByIdAndCandidateId: jest.fn(),
  update: jest.fn(),
});

// ---------------------------------------------------------------------------
// Queue Stub
// ---------------------------------------------------------------------------
interface MockQueue {
  jobs: Array<{ name: string; data: unknown }>;
  add: jest.Mock<Promise<void>, [string, unknown]>;
}

const createMockQueue = (): MockQueue => {
  const mockQueue: MockQueue = {
    jobs: [],
    add: jest.fn(),
  };
  mockQueue.add.mockImplementation(async function (name: string, data: unknown) {
    mockQueue.jobs.push({ name, data });
  });
  return mockQueue;
};

// ---------------------------------------------------------------------------
// Test Constants
// ---------------------------------------------------------------------------
const WORKSPACE_ID = 'ws-1';
const CANDIDATE_ID = 'cand-1';
const SUMMARY_ID = 'summary-1';

const mockCandidate = {
  id: CANDIDATE_ID,
  workspaceId: WORKSPACE_ID,
  name: 'Alice Smith',
  email: 'alice@example.com',
  createdAt: new Date(),
};

const mockSummary = {
  id: SUMMARY_ID,
  candidateId: CANDIDATE_ID,
  status: SummaryStatus.PENDING,
  score: null,
  strengths: null,
  concerns: null,
  summary: null,
  recommendedDecision: null,
  provider: null,
  promptVersion: null,
  errorMessage: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('SummariesService', () => {
  let service: SummariesService;
  let candidateRepo: jest.Mocked<ICandidateRepository>;
  let summaryRepo: jest.Mocked<ISummaryRepository>;
  let queue: MockQueue;

  beforeEach(async () => {
    candidateRepo = createMockCandidateRepository();
    summaryRepo = createMockSummaryRepository();
    queue = createMockQueue();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummariesService,
        { provide: CANDIDATE_REPOSITORY, useValue: candidateRepo },
        { provide: SUMMARY_REPOSITORY, useValue: summaryRepo },
        { provide: getQueueToken(SUMMARY_QUEUE), useValue: queue },
      ],
    }).compile();

    service = module.get<SummariesService>(SummariesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestGeneration', () => {
    it('creates a PENDING summary and enqueues a job', async () => {
      candidateRepo.findByIdAndWorkspace.mockResolvedValue(mockCandidate);
      summaryRepo.create.mockResolvedValue(mockSummary);

      const result = await service.requestGeneration(WORKSPACE_ID, CANDIDATE_ID);

      expect(result.status).toBe(SummaryStatus.PENDING);
      expect(result.candidateId).toBe(CANDIDATE_ID);
      expect(candidateRepo.findByIdAndWorkspace).toHaveBeenCalledWith(CANDIDATE_ID, WORKSPACE_ID);
      expect(summaryRepo.create).toHaveBeenCalledWith({
        candidateId: CANDIDATE_ID,
        status: SummaryStatus.PENDING,
      });
      expect(queue.add).toHaveBeenCalledWith(
        SUMMARY_JOB.GENERATE,
        { summaryId: SUMMARY_ID, candidateId: CANDIDATE_ID },
        expect.objectContaining({
          attempts: SUMMARY_JOB_OPTIONS.attempts,
          backoff: SUMMARY_JOB_OPTIONS.backoff,
          timeout: SUMMARY_JOB_OPTIONS.timeout,
        })
      );
    });

    it('throws NotFoundException for a candidate in a different workspace', async () => {
      candidateRepo.findByIdAndWorkspace.mockResolvedValue(null);

      await expect(service.requestGeneration('ws-other', CANDIDATE_ID)).rejects.toThrow(
        NotFoundException
      );

      expect(candidateRepo.findByIdAndWorkspace).toHaveBeenCalledWith(CANDIDATE_ID, 'ws-other');
    });

    it('throws NotFoundException for a non-existent candidate', async () => {
      candidateRepo.findByIdAndWorkspace.mockResolvedValue(null);

      await expect(service.requestGeneration(WORKSPACE_ID, 'no-such-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('listSummaries', () => {
    const mockSummaries = [
      { ...mockSummary, id: 'summary-1', status: SummaryStatus.COMPLETED },
      { ...mockSummary, id: 'summary-2', status: SummaryStatus.PENDING },
    ];

    it('returns all summaries for the candidate', async () => {
      candidateRepo.findByIdAndWorkspace.mockResolvedValue(mockCandidate);
      summaryRepo.findByCandidateId.mockResolvedValue(mockSummaries);

      const results = await service.listSummaries(WORKSPACE_ID, CANDIDATE_ID);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe(SummaryStatus.COMPLETED);
      expect(summaryRepo.findByCandidateId).toHaveBeenCalledWith(CANDIDATE_ID);
    });

    it('returns empty array when no summaries exist', async () => {
      candidateRepo.findByIdAndWorkspace.mockResolvedValue(mockCandidate);
      summaryRepo.findByCandidateId.mockResolvedValue([]);

      const results = await service.listSummaries(WORKSPACE_ID, CANDIDATE_ID);

      expect(results).toEqual([]);
    });

    it('throws NotFoundException for wrong workspace', async () => {
      candidateRepo.findByIdAndWorkspace.mockResolvedValue(null);

      await expect(service.listSummaries('ws-bad', CANDIDATE_ID)).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('getSummary', () => {
    it('returns a specific summary', async () => {
      candidateRepo.findByIdAndWorkspace.mockResolvedValue(mockCandidate);
      summaryRepo.findByIdAndCandidateId.mockResolvedValue(mockSummary);

      const result = await service.getSummary(WORKSPACE_ID, CANDIDATE_ID, SUMMARY_ID);

      expect(result.id).toBe(SUMMARY_ID);
      expect(summaryRepo.findByIdAndCandidateId).toHaveBeenCalledWith(SUMMARY_ID, CANDIDATE_ID);
    });

    it('throws NotFoundException when summary does not exist', async () => {
      candidateRepo.findByIdAndWorkspace.mockResolvedValue(mockCandidate);
      summaryRepo.findByIdAndCandidateId.mockResolvedValue(null);

      await expect(
        service.getSummary(WORKSPACE_ID, CANDIDATE_ID, 'no-such-summary')
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when summary belongs to different candidate', async () => {
      candidateRepo.findByIdAndWorkspace.mockResolvedValue(mockCandidate);
      summaryRepo.findByIdAndCandidateId.mockResolvedValue(null);

      await expect(service.getSummary(WORKSPACE_ID, CANDIDATE_ID, SUMMARY_ID)).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
