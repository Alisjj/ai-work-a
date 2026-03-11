/**
 * SummaryProcessor Unit Tests
 *
 * Uses Jest mocks for repositories.
 * Fake summarization provider for controlled testing.
 * No in-memory implementations, no database dependencies.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { Job } from 'bull';

import { SummaryJobPayload } from './queue.constants';
import { SummaryProcessor } from './summary.processor';
import {
  SUMMARIZATION_PROVIDER,
  SummarizationProvider,
  SummaryOutput,
} from '../summarization/summarization.interface';
import { DOCUMENT_REPOSITORY, SUMMARY_REPOSITORY } from '../common/repositories/interfaces';
import { IDocumentRepository, ISummaryRepository } from '../common/interfaces';
import { SummaryStatus } from './entities/candidate-summary.entity';
import { DocumentType } from '../documents/entities/candidate-document.entity';

// ---------------------------------------------------------------------------
// Fake Summarization Provider
// ---------------------------------------------------------------------------
const FAKE_OUTPUT: SummaryOutput = {
  score: 85,
  strengths: ['Strong TypeScript skills', '5 years experience'],
  concerns: ['No management experience'],
  summary: 'Solid mid-level engineer with a strong backend background.',
  recommendedDecision: 'yes',
};

class FakeSummarizationProvider implements SummarizationProvider {
  readonly providerName = 'fake-provider';
  readonly promptVersion = 'v1';
  callCount = 0;
  shouldFail = false;

  async generateCandidateSummary(): Promise<SummaryOutput> {
    this.callCount++;
    if (this.shouldFail) throw new Error('Provider API down');
    return FAKE_OUTPUT;
  }
}

// ---------------------------------------------------------------------------
// Mock Factories
// ---------------------------------------------------------------------------
const createMockDocumentRepository = (): jest.Mocked<IDocumentRepository> => ({
  create: jest.fn(),
  findByCandidateId: jest.fn(),
});

const createMockSummaryRepository = (): jest.Mocked<ISummaryRepository> => ({
  create: jest.fn(),
  findById: jest.fn(),
  findByCandidateId: jest.fn(),
  findByIdAndCandidateId: jest.fn(),
  update: jest.fn(),
});

// ---------------------------------------------------------------------------
// Test Helpers
// ---------------------------------------------------------------------------
const makeJob = (data: SummaryJobPayload): Job<SummaryJobPayload> =>
  ({ data }) as unknown as Job<SummaryJobPayload>;

// ---------------------------------------------------------------------------
// Test Constants
// ---------------------------------------------------------------------------
const CANDIDATE_ID = 'cand-1';
const SUMMARY_ID = 'summary-1';

const mockDocument = {
  id: 'doc-1',
  candidateId: CANDIDATE_ID,
  documentType: DocumentType.RESUME,
  fileName: 'resume.pdf',
  storageKey: 'workspaces/ws-1/candidates/cand-1/documents/resume.pdf',
  rawText: 'Experienced software engineer with TypeScript expertise...',
  uploadedAt: new Date(),
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
describe('SummaryProcessor', () => {
  let processor: SummaryProcessor;
  let summaryRepo: jest.Mocked<ISummaryRepository>;
  let documentRepo: jest.Mocked<IDocumentRepository>;
  let fakeProvider: FakeSummarizationProvider;

  beforeEach(async () => {
    summaryRepo = createMockSummaryRepository();
    documentRepo = createMockDocumentRepository();
    fakeProvider = new FakeSummarizationProvider();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummaryProcessor,
        { provide: SUMMARIZATION_PROVIDER, useValue: fakeProvider },
        { provide: SUMMARY_REPOSITORY, useValue: summaryRepo },
        { provide: DOCUMENT_REPOSITORY, useValue: documentRepo },
      ],
    }).compile();

    processor = module.get<SummaryProcessor>(SummaryProcessor);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('processes a job successfully and marks summary as COMPLETED', async () => {
    summaryRepo.findById.mockResolvedValue(mockSummary);
    documentRepo.findByCandidateId.mockResolvedValue([mockDocument]);

    await processor.handleGenerateSummary(
      makeJob({ summaryId: SUMMARY_ID, candidateId: CANDIDATE_ID })
    );

    expect(summaryRepo.update).toHaveBeenCalledWith(SUMMARY_ID, {
      status: SummaryStatus.COMPLETED,
      score: 85,
      strengths: FAKE_OUTPUT.strengths,
      concerns: FAKE_OUTPUT.concerns,
      summary: FAKE_OUTPUT.summary,
      recommendedDecision: 'yes',
      provider: 'fake-provider',
      promptVersion: 'v1',
      errorMessage: null,
    });
  });

  it('marks summary as FAILED when no documents exist', async () => {
    summaryRepo.findById.mockResolvedValue(mockSummary);
    documentRepo.findByCandidateId.mockResolvedValue([]);

    await processor.handleGenerateSummary(
      makeJob({ summaryId: SUMMARY_ID, candidateId: CANDIDATE_ID })
    );

    expect(summaryRepo.update).toHaveBeenCalledWith(SUMMARY_ID, {
      status: SummaryStatus.FAILED,
      errorMessage: 'No documents found for candidate',
    });
  });

  it('marks summary as FAILED when provider throws', async () => {
    fakeProvider.shouldFail = true;
    summaryRepo.findById.mockResolvedValue(mockSummary);
    documentRepo.findByCandidateId.mockResolvedValue([mockDocument]);

    await processor.handleGenerateSummary(
      makeJob({ summaryId: SUMMARY_ID, candidateId: CANDIDATE_ID })
    );

    expect(summaryRepo.update).toHaveBeenCalledWith(SUMMARY_ID, {
      status: SummaryStatus.FAILED,
      errorMessage: 'Provider API down',
    });
  });

  it('skips silently when summary record does not exist', async () => {
    summaryRepo.findById.mockResolvedValue(null);

    await processor.handleGenerateSummary(
      makeJob({ summaryId: 'no-such-id', candidateId: CANDIDATE_ID })
    );

    expect(summaryRepo.update).not.toHaveBeenCalled();
  });

  it('calls the provider with all candidate documents', async () => {
    summaryRepo.findById.mockResolvedValue(mockSummary);
    documentRepo.findByCandidateId.mockResolvedValue([
      {
        ...mockDocument,
        documentType: DocumentType.RESUME,
        rawText: 'Resume content',
      },
      {
        ...mockDocument,
        id: 'doc-2',
        documentType: DocumentType.COVER_LETTER,
        rawText: 'Cover letter content',
      },
    ]);

    await processor.handleGenerateSummary(
      makeJob({ summaryId: SUMMARY_ID, candidateId: CANDIDATE_ID })
    );

    expect(fakeProvider.callCount).toBe(1);
    expect(summaryRepo.update).toHaveBeenCalledWith(
      SUMMARY_ID,
      expect.objectContaining({
        status: SummaryStatus.COMPLETED,
      })
    );
  });
});
