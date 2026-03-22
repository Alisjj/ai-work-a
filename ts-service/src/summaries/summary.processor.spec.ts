import { Test, TestingModule } from '@nestjs/testing';

import { DOCUMENT_REPOSITORY, IDocumentRepository } from '../documents/document-repository.interface';
import { DocumentRecord } from '../documents/documents.types';
import { SummaryProcessor } from './summary.processor';
import { SUMMARY_JOB, SummaryJobPayload } from './queue.constants';
import { SUMMARIZATION_PROVIDER } from '../llm/summarization-provider.interface';
import { SUMMARY_REPOSITORY, ISummaryRepository } from './summary-repository.interface';
import { SummaryStatus, RecommendedDecision } from '../entities/candidate-summary.entity';
import { SummaryRecord } from './summaries.types';
import { FakeSummarizationProvider } from '../llm/fake-summarization.provider';
import { Job } from 'bull';

const makeDocumentRecord = (override: Partial<DocumentRecord> = {}): DocumentRecord => ({
    id: 'doc-1',
    candidateId: 'cand-1',
    documentType: 'resume',
    fileName: 'cv.txt',
    storageKey: 'candidates/cand-1/documents/cv.txt',
    rawText: 'Ten years of backend engineering.',
    uploadedAt: new Date(),
    ...override,
});

const makeSummaryRecord = (override: Partial<SummaryRecord> = {}): SummaryRecord => ({
    id: 'sum-1',
    candidateId: 'cand-1',
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
    ...override,
});

const makeJob = (
    data: SummaryJobPayload,
    options: { attempts?: number; attemptsMade?: number } = {},
): Job<SummaryJobPayload> =>
    ({
        data,
        opts: { attempts: options.attempts ?? 1 },
        attemptsMade: options.attemptsMade ?? 0,
    } as Job<SummaryJobPayload>);

describe('SummaryProcessor', () => {
    let processor: SummaryProcessor;

    const summaryRepo: jest.Mocked<ISummaryRepository> = {
        findById: jest.fn(),
        findByIdAndCandidateId: jest.fn(),
        findByCandidateId: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    };

    const documentRepo: jest.Mocked<IDocumentRepository> = {
        findById: jest.fn(),
        findByCandidateId: jest.fn(),
        create: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SummaryProcessor,
                FakeSummarizationProvider,
                { provide: SUMMARIZATION_PROVIDER, useClass: FakeSummarizationProvider },
                { provide: SUMMARY_REPOSITORY, useValue: summaryRepo },
                { provide: DOCUMENT_REPOSITORY, useValue: documentRepo },
            ],
        }).compile();

        processor = module.get<SummaryProcessor>(SummaryProcessor);
    });

    describe('handleGenerateSummary', () => {
        it('calls provider and marks summary as COMPLETED on success', async () => {
            const summary = makeSummaryRecord();
            const document = makeDocumentRecord();
            const updatedSummary = makeSummaryRecord({
                status: SummaryStatus.COMPLETED,
                score: 72,
            });

            summaryRepo.findById.mockResolvedValue(summary);
            documentRepo.findByCandidateId.mockResolvedValue([document]);
            summaryRepo.update.mockResolvedValue(updatedSummary);

            await processor.handleGenerateSummary(
                makeJob({ summaryId: 'sum-1', candidateId: 'cand-1' }),
            );

            expect(summaryRepo.update).toHaveBeenCalledWith(
                'sum-1',
                expect.objectContaining({
                    status: SummaryStatus.COMPLETED,
                    score: expect.any(Number),
                    strengths: expect.any(Array),
                    concerns: expect.any(Array),
                    summary: expect.any(String),
                    recommendedDecision: expect.any(String),
                    provider: 'fake',
                    promptVersion: 'v0-test',
                    errorMessage: null,
                }),
            );
        });

        it('marks summary as FAILED when no documents exist', async () => {
            const summary = makeSummaryRecord();
            summaryRepo.findById.mockResolvedValue(summary);
            documentRepo.findByCandidateId.mockResolvedValue([]);
            summaryRepo.update.mockResolvedValue(
                makeSummaryRecord({ status: SummaryStatus.FAILED, errorMessage: 'No documents found for candidate' }),
            );

            await processor.handleGenerateSummary(
                makeJob({ summaryId: 'sum-1', candidateId: 'cand-1' }),
            );

            expect(summaryRepo.update).toHaveBeenCalledWith('sum-1', {
                status: SummaryStatus.FAILED,
                errorMessage: 'No documents found for candidate',
            });
        });

        it('marks summary as FAILED and rethrows on the final provider failure', async () => {
            const summary = makeSummaryRecord();
            const document = makeDocumentRecord();
            summaryRepo.findById.mockResolvedValue(summary);
            documentRepo.findByCandidateId.mockResolvedValue([document]);

            // Override the provider to throw
            jest
                .spyOn(
                    (processor as any).summarizationProvider,
                    'generateCandidateSummary',
                )
                .mockRejectedValue(new Error('LLM timeout'));

            summaryRepo.update.mockResolvedValue(
                makeSummaryRecord({ status: SummaryStatus.FAILED, errorMessage: 'LLM timeout' }),
            );

            await expect(
                processor.handleGenerateSummary(
                    makeJob(
                        { summaryId: 'sum-1', candidateId: 'cand-1' },
                        { attempts: 3, attemptsMade: 2 },
                    ),
                ),
            ).rejects.toThrow('LLM timeout');

            expect(summaryRepo.update).toHaveBeenCalledWith(
                'sum-1',
                expect.objectContaining({
                    status: SummaryStatus.FAILED,
                    errorMessage: 'LLM timeout',
                }),
            );
        });

        it('rethrows without marking FAILED before the final retry', async () => {
            const summary = makeSummaryRecord();
            const document = makeDocumentRecord();
            summaryRepo.findById.mockResolvedValue(summary);
            documentRepo.findByCandidateId.mockResolvedValue([document]);

            jest
                .spyOn(
                    (processor as any).summarizationProvider,
                    'generateCandidateSummary',
                )
                .mockRejectedValue(new Error('Transient provider issue'));

            await expect(
                processor.handleGenerateSummary(
                    makeJob(
                        { summaryId: 'sum-1', candidateId: 'cand-1' },
                        { attempts: 3, attemptsMade: 0 },
                    ),
                ),
            ).rejects.toThrow('Transient provider issue');

            expect(summaryRepo.update).not.toHaveBeenCalledWith(
                'sum-1',
                expect.objectContaining({ status: SummaryStatus.FAILED }),
            );
        });

        it('skips processing when summary record is not found', async () => {
            summaryRepo.findById.mockResolvedValue(null);

            await processor.handleGenerateSummary(
                makeJob({ summaryId: 'sum-missing', candidateId: 'cand-1' }),
            );

            expect(documentRepo.findByCandidateId).not.toHaveBeenCalled();
            expect(summaryRepo.update).not.toHaveBeenCalled();
        });
    });
});
