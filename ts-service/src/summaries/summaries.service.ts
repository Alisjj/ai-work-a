import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import {
  SUMMARY_QUEUE,
  SUMMARY_JOB,
  SummaryJobPayload,
  SUMMARY_JOB_OPTIONS,
} from './queue.constants';
import { SUMMARIZATION_PROVIDER, SummarizationProvider } from '../llm/summarization-provider.interface';
import { SUMMARY_REPOSITORY, ISummaryRepository, SummaryRecord } from '../common/repositories/summary.repository';
import { CANDIDATE_REPOSITORY, ICandidateRepository } from '../common/repositories/candidate.repository';
import { SummaryStatus } from '../entities/candidate-summary.entity';

@Injectable()
export class SummariesService {
  constructor(
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepo: ICandidateRepository,
    @Inject(SUMMARY_REPOSITORY)
    private readonly summaryRepo: ISummaryRepository,
    @InjectQueue(SUMMARY_QUEUE)
    private readonly summaryQueue: Queue,
  ) {}

  private async assertCandidateOwnership(candidateId: string, workspaceId: string): Promise<void> {
    const candidate = await this.candidateRepo.findByIdAndWorkspace(candidateId, workspaceId);
    if (!candidate) {
      throw new NotFoundException(`Candidate ${candidateId} not found in your workspace`);
    }
  }

  async requestGeneration(workspaceId: string, candidateId: string): Promise<SummaryRecord> {
    await this.assertCandidateOwnership(candidateId, workspaceId);

    const summary = await this.summaryRepo.create({
      candidateId,
      status: SummaryStatus.PENDING,
    });

    const payload: SummaryJobPayload = { summaryId: summary.id, candidateId };

    await this.summaryQueue.add(SUMMARY_JOB.GENERATE, payload, SUMMARY_JOB_OPTIONS);

    return summary;
  }

  async listSummaries(workspaceId: string, candidateId: string): Promise<SummaryRecord[]> {
    await this.assertCandidateOwnership(candidateId, workspaceId);
    return this.summaryRepo.findByCandidateId(candidateId);
  }

  async getSummary(
    workspaceId: string,
    candidateId: string,
    summaryId: string,
  ): Promise<SummaryRecord> {
    await this.assertCandidateOwnership(candidateId, workspaceId);
    const summary = await this.summaryRepo.findByIdAndCandidateId(summaryId, candidateId);
    if (!summary) {
      throw new NotFoundException(`Summary ${summaryId} not found`);
    }
    return summary;
  }
}
