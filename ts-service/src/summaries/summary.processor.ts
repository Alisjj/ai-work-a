import { Processor, Process } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';

import { DOCUMENT_REPOSITORY, IDocumentRepository } from '../documents/document-repository.interface';
import { DocumentRecord } from '../documents/documents.types';
import { SUMMARY_REPOSITORY, ISummaryRepository } from './summary-repository.interface';
import {
  SUMMARY_QUEUE,
  SUMMARY_JOB,
  SUMMARY_PROCESSOR_CONCURRENCY,
  SummaryJobPayload,
} from './queue.constants';
import { SUMMARIZATION_PROVIDER, SummarizationProvider } from '../llm/summarization-provider.interface';
import { SummaryStatus, RecommendedDecision } from '../entities/candidate-summary.entity';

/**
 * SummaryProcessor - Handles background job processing for summary generation
 * Concurrency is capped to avoid overwhelming the LLM provider.
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
    private readonly documentRepo: IDocumentRepository,
  ) {}

  @Process({ name: SUMMARY_JOB.GENERATE, concurrency: SUMMARY_PROCESSOR_CONCURRENCY })
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
      const attempts = typeof job.opts.attempts === 'number' ? job.opts.attempts : 1;
      const currentAttempt = job.attemptsMade + 1;
      const isFinalAttempt = currentAttempt >= attempts;

      this.logger.error(
        `Summary ${summaryId} failed on attempt ${currentAttempt}/${attempts}: ${message}`,
      );

      if (isFinalAttempt) {
        await this.summaryRepo.update(summaryId, {
          status: SummaryStatus.FAILED,
          errorMessage: message,
        });
      }

      throw err instanceof Error ? err : new Error(message);
    }
  }
}
