import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';

import { SUMMARY_QUEUE, SUMMARY_JOB, SummaryJobPayload } from './queue.constants';
import {
  SUMMARIZATION_PROVIDER,
  SummarizationProvider,
} from '../summarization/summarization.interface';
import {
  DOCUMENT_REPOSITORY,
  SUMMARY_REPOSITORY,
  IDocumentRepository,
  ISummaryRepository,
  DocumentRecord,
  SummaryStatus,
  RecommendedDecision,
} from '../common/repositories/interfaces';

/**
 * SummaryProcessor - Handles background job processing for summary generation
 * Concurrency: 5 jobs max to prevent API rate limiting and resource exhaustion
 */
@Processor(SUMMARY_QUEUE)
export class SummaryProcessor {
  private readonly logger = new Logger(SummaryProcessor.name);

  constructor(
    @Inject(SUMMARIZATION_PROVIDER)
    private readonly summarizationProvider: SummarizationProvider,
    @Inject(SUMMARY_REPOSITORY)
    private readonly summaryRepo: ISummaryRepository,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepo: IDocumentRepository
  ) {}

  @Process(SUMMARY_JOB.GENERATE)
  async handleGenerateSummary(job: Job<SummaryJobPayload>): Promise<void> {
    const { summaryId, candidateId } = job.data;
    this.logger.log(`Processing summary ${summaryId} for candidate ${candidateId}`);

    const summary = await this.summaryRepo.findById(summaryId);
    if (!summary) {
      this.logger.warn(`Summary ${summaryId} not found — skipping`);
      return;
    }

    const documents = await this.documentRepo.findByCandidateId(candidateId);
    if (!documents.length) {
      await this.summaryRepo.update(summaryId, {
        status: SummaryStatus.FAILED,
        errorMessage: 'No documents found for candidate',
      });
      return;
    }

    try {
      const result = await this.summarizationProvider.generateCandidateSummary({
        candidateId,
        documents: documents.map((d: DocumentRecord) => ({
          documentType: d.documentType,
          fileName: d.fileName,
          rawText: d.rawText,
        })),
      });

      await this.summaryRepo.update(summaryId, {
        status: SummaryStatus.COMPLETED,
        score: result.score,
        strengths: result.strengths,
        concerns: result.concerns,
        summary: result.summary,
        recommendedDecision: result.recommendedDecision as RecommendedDecision,
        provider: this.summarizationProvider.providerName,
        promptVersion: this.summarizationProvider.promptVersion,
        errorMessage: null,
      });

      this.logger.log(`Summary ${summaryId} completed`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Summary ${summaryId} failed: ${message}`);
      await this.summaryRepo.update(summaryId, {
        status: SummaryStatus.FAILED,
        errorMessage: message ?? 'Unknown error',
      });
    }
  }
}
