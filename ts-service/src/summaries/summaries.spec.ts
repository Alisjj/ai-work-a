/**
 * SummariesService tests.
 *
 * Uses InMemoryCandidateRepository and InMemorySummaryRepository.
 * No TypeORM, no database, no Jest mocking of internals.
 * The queue is a lightweight stub.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';

import { SummariesService } from './summaries.service';
import { SummaryStatus } from './entities/candidate-summary.entity';
import {
  CANDIDATE_REPOSITORY,
  SUMMARY_REPOSITORY,
} from '../common/interfaces';
import {
  InMemoryCandidateRepository,
} from '../candidates/repositories/in-memory-candidate.repository';
import {
  InMemorySummaryRepository,
} from './repositories/in-memory-summary.repository';
import { SUMMARY_QUEUE, SUMMARY_JOB } from './queue.constants';

// ---------------------------------------------------------------------------
// Minimal queue stub — just records what was enqueued
// ---------------------------------------------------------------------------
class StubQueue {
  jobs: Array<{ name: string; data: unknown }> = [];
  async add(name: string, data: unknown) {
    this.jobs.push({ name, data });
  }
}

// ---------------------------------------------------------------------------
// Test builder
// ---------------------------------------------------------------------------
async function buildModule() {
  const candidateRepo = new InMemoryCandidateRepository();
  const summaryRepo = new InMemorySummaryRepository();
  const queue = new StubQueue();

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      SummariesService,
      { provide: CANDIDATE_REPOSITORY, useValue: candidateRepo },
      { provide: SUMMARY_REPOSITORY, useValue: summaryRepo },
      { provide: getQueueToken(SUMMARY_QUEUE), useValue: queue },
    ],
  }).compile();

  return {
    service: module.get<SummariesService>(SummariesService),
    candidateRepo,
    summaryRepo,
    queue,
  };
}

// Seed a candidate in workspace ws-1
const WORKSPACE_ID = 'ws-1';
const CANDIDATE_ID = 'cand-1';

function seedCandidate(repo: InMemoryCandidateRepository) {
  repo.seed([
    {
      id: CANDIDATE_ID,
      workspaceId: WORKSPACE_ID,
      name: 'Alice Smith',
      email: 'alice@example.com',
      createdAt: new Date(),
    },
  ]);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('SummariesService', () => {

  describe('requestGeneration', () => {
    it('creates a PENDING summary and enqueues a job', async () => {
      const { service, candidateRepo, summaryRepo, queue } = await buildModule();
      seedCandidate(candidateRepo);

      const result = await service.requestGeneration(WORKSPACE_ID, CANDIDATE_ID);

      expect(result.status).toBe(SummaryStatus.PENDING);
      expect(result.candidateId).toBe(CANDIDATE_ID);

      // Verify the job was enqueued with the right payload
      expect(queue.jobs).toHaveLength(1);
      expect(queue.jobs[0].name).toBe(SUMMARY_JOB.GENERATE);
      expect(queue.jobs[0].data).toMatchObject({
        summaryId: result.id,
        candidateId: CANDIDATE_ID,
      });

      // Verify persisted in the repo
      const saved = await summaryRepo.findById(result.id);
      expect(saved).not.toBeNull();
      expect(saved!.status).toBe(SummaryStatus.PENDING);
    });

    it('throws NotFoundException for a candidate in a different workspace', async () => {
      const { service, candidateRepo } = await buildModule();
      seedCandidate(candidateRepo);

      await expect(
        service.requestGeneration('ws-other', CANDIDATE_ID),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException for a non-existent candidate', async () => {
      const { service } = await buildModule();
      await expect(
        service.requestGeneration(WORKSPACE_ID, 'no-such-id'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('listSummaries', () => {
    it('returns all summaries for the candidate, newest first', async () => {
      const { service, candidateRepo, summaryRepo } = await buildModule();
      seedCandidate(candidateRepo);

      await summaryRepo.create({ candidateId: CANDIDATE_ID, status: SummaryStatus.COMPLETED });
      await new Promise(resolve => setTimeout(resolve, 5));
      await summaryRepo.create({ candidateId: CANDIDATE_ID, status: SummaryStatus.PENDING });

      const results = await service.listSummaries(WORKSPACE_ID, CANDIDATE_ID);
      expect(results).toHaveLength(2);
      // newest first
      expect(results[0].status).toBe(SummaryStatus.PENDING);
    });

    it('returns empty array when no summaries exist', async () => {
      const { service, candidateRepo } = await buildModule();
      seedCandidate(candidateRepo);
      const results = await service.listSummaries(WORKSPACE_ID, CANDIDATE_ID);
      expect(results).toEqual([]);
    });

    it('throws NotFoundException for wrong workspace', async () => {
      const { service, candidateRepo } = await buildModule();
      seedCandidate(candidateRepo);
      await expect(
        service.listSummaries('ws-bad', CANDIDATE_ID),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getSummary', () => {
    it('returns a specific summary', async () => {
      const { service, candidateRepo, summaryRepo } = await buildModule();
      seedCandidate(candidateRepo);
      const created = await summaryRepo.create({
        candidateId: CANDIDATE_ID,
        status: SummaryStatus.COMPLETED,
      });

      const result = await service.getSummary(WORKSPACE_ID, CANDIDATE_ID, created.id);
      expect(result.id).toBe(created.id);
    });

    it('throws NotFoundException when summary does not exist', async () => {
      const { service, candidateRepo } = await buildModule();
      seedCandidate(candidateRepo);
      await expect(
        service.getSummary(WORKSPACE_ID, CANDIDATE_ID, 'no-such-summary'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException when summary belongs to different candidate', async () => {
      const { service, candidateRepo, summaryRepo } = await buildModule();
      seedCandidate(candidateRepo);
      const created = await summaryRepo.create({
        candidateId: 'other-candidate',
        status: SummaryStatus.COMPLETED,
      });

      await expect(
        service.getSummary(WORKSPACE_ID, CANDIDATE_ID, created.id),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
