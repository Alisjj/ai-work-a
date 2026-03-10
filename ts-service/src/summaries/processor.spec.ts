/**
 * SummaryProcessor tests.
 *
 * Uses InMemoryDocumentRepository and InMemorySummaryRepository.
 * The summarization provider is a simple fake implementing the interface.
 * No Jest mocking, no TypeORM, no database.
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
import {
  DOCUMENT_REPOSITORY,
  SUMMARY_REPOSITORY,
} from '../repositories/interfaces';
import {
  InMemoryDocumentRepository,
  InMemorySummaryRepository,
} from '../repositories/inmemory';
import {
  SummaryStatus,
} from './entities/candidate-summary.entity';
import { DocumentType } from '../documents/entities/candidate-document.entity';

// ---------------------------------------------------------------------------
// Fake summarization provider — implements the interface, no mocking
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
// Test builder
// ---------------------------------------------------------------------------
async function buildProcessor(provider?: SummarizationProvider) {
  const summaryRepo = new InMemorySummaryRepository();
  const documentRepo = new InMemoryDocumentRepository();
  const fakeProvider = provider ?? new FakeSummarizationProvider();

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      SummaryProcessor,
      { provide: SUMMARIZATION_PROVIDER, useValue: fakeProvider },
      { provide: SUMMARY_REPOSITORY, useValue: summaryRepo },
      { provide: DOCUMENT_REPOSITORY, useValue: documentRepo },
    ],
  }).compile();

  return {
    processor: module.get<SummaryProcessor>(SummaryProcessor),
    summaryRepo,
    documentRepo,
    provider: fakeProvider as FakeSummarizationProvider,
  };
}

const makeJob = (data: SummaryJobPayload) => ({ data } as unknown as Job<SummaryJobPayload>);

const CANDIDATE_ID = 'cand-1';

async function seedDoc(documentRepo: InMemoryDocumentRepository) {
  return documentRepo.create({
    candidateId: CANDIDATE_ID,
    documentType: DocumentType.RESUME,
    fileName: 'resume.pdf',
    storageKey: 'keys/resume.pdf',
    rawText: 'Experienced software engineer with TypeScript expertise...',
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('SummaryProcessor', () => {

  it('processes a job successfully and marks summary as COMPLETED', async () => {
    const { processor, summaryRepo, documentRepo } = await buildProcessor();
    const summary = await summaryRepo.create({
      candidateId: CANDIDATE_ID,
      status: SummaryStatus.PENDING,
    });
    await seedDoc(documentRepo);

    await processor.handleGenerateSummary(
      makeJob({ summaryId: summary.id, candidateId: CANDIDATE_ID }),
    );

    const updated = await summaryRepo.findById(summary.id);
    expect(updated!.status).toBe(SummaryStatus.COMPLETED);
    expect(updated!.score).toBe(85);
    expect(updated!.strengths).toEqual(FAKE_OUTPUT.strengths);
    expect(updated!.concerns).toEqual(FAKE_OUTPUT.concerns);
    expect(updated!.summary).toBe(FAKE_OUTPUT.summary);
    expect(updated!.recommendedDecision).toBe('yes');
    expect(updated!.provider).toBe('fake-provider');
    expect(updated!.promptVersion).toBe('v1');
    expect(updated!.errorMessage).toBeNull();
  });

  it('marks summary as FAILED when no documents exist', async () => {
    const { processor, summaryRepo } = await buildProcessor();
    const summary = await summaryRepo.create({
      candidateId: CANDIDATE_ID,
      status: SummaryStatus.PENDING,
    });
    // No documents seeded

    await processor.handleGenerateSummary(
      makeJob({ summaryId: summary.id, candidateId: CANDIDATE_ID }),
    );

    const updated = await summaryRepo.findById(summary.id);
    expect(updated!.status).toBe(SummaryStatus.FAILED);
    expect(updated!.errorMessage).toBe('No documents found for candidate');
  });

  it('marks summary as FAILED when provider throws', async () => {
    const fakeProvider = new FakeSummarizationProvider();
    fakeProvider.shouldFail = true;

    const { processor, summaryRepo, documentRepo } = await buildProcessor(fakeProvider);
    const summary = await summaryRepo.create({
      candidateId: CANDIDATE_ID,
      status: SummaryStatus.PENDING,
    });
    await seedDoc(documentRepo);

    await processor.handleGenerateSummary(
      makeJob({ summaryId: summary.id, candidateId: CANDIDATE_ID }),
    );

    const updated = await summaryRepo.findById(summary.id);
    expect(updated!.status).toBe(SummaryStatus.FAILED);
    expect(updated!.errorMessage).toBe('Provider API down');
  });

  it('skips silently when summary record does not exist', async () => {
    const { processor, summaryRepo } = await buildProcessor();

    await processor.handleGenerateSummary(
      makeJob({ summaryId: 'no-such-id', candidateId: CANDIDATE_ID }),
    );

    // Nothing was persisted
    const all = await summaryRepo.findByCandidateId(CANDIDATE_ID);
    expect(all).toHaveLength(0);
  });

  it('calls the provider with all candidate documents', async () => {
    const fakeProvider = new FakeSummarizationProvider();
    const { processor, summaryRepo, documentRepo } = await buildProcessor(fakeProvider);
    const summary = await summaryRepo.create({
      candidateId: CANDIDATE_ID,
      status: SummaryStatus.PENDING,
    });
    await documentRepo.create({
      candidateId: CANDIDATE_ID,
      documentType: DocumentType.RESUME,
      fileName: 'resume.pdf',
      storageKey: 'k1',
      rawText: 'Resume content',
    });
    await documentRepo.create({
      candidateId: CANDIDATE_ID,
      documentType: DocumentType.COVER_LETTER,
      fileName: 'cover.pdf',
      storageKey: 'k2',
      rawText: 'Cover letter content',
    });

    await processor.handleGenerateSummary(
      makeJob({ summaryId: summary.id, candidateId: CANDIDATE_ID }),
    );

    expect(fakeProvider.callCount).toBe(1);
    const updated = await summaryRepo.findById(summary.id);
    expect(updated!.status).toBe(SummaryStatus.COMPLETED);
  });
});
