import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

import { CandidatesService } from '../candidates/candidates.service';
import { SUMMARY_REPOSITORY, ISummaryRepository } from './summary-repository.interface';
import { SummaryRecord } from './summaries.types';
import {
  SUMMARY_QUEUE,
  SUMMARY_JOB,
  SummaryJobPayload,
  SUMMARY_JOB_OPTIONS,
} from './queue.constants';
import { SummaryStatus } from '../entities/candidate-summary.entity';

@Injectable()
export class SummariesService {
  constructor(
    private readonly candidatesService: CandidatesService,
    @Inject(SUMMARY_REPOSITORY)
    private readonly summaryRepo: ISummaryRepository,
    @InjectQueue(SUMMARY_QUEUE)
    private readonly summaryQueue: Queue,
  ) {}

  async requestGeneration(workspaceId: string, candidateId: string): Promise<SummaryRecord> {
    await this.candidatesService.getCandidate(workspaceId, candidateId);

    const summary = await this.summaryRepo.create({
      candidateId,
      status: SummaryStatus.PENDING,
    });

    const payload: SummaryJobPayload = { summaryId: summary.id, candidateId };

    await this.summaryQueue.add(SUMMARY_JOB.GENERATE, payload, SUMMARY_JOB_OPTIONS);

    return summary;
  }

  async listSummaries(workspaceId: string, candidateId: string): Promise<SummaryRecord[]> {
    await this.candidatesService.getCandidate(workspaceId, candidateId);
    return this.summaryRepo.findByCandidateId(candidateId);
  }

  async getSummary(
    workspaceId: string,
    candidateId: string,
    summaryId: string,
  ): Promise<SummaryRecord> {
    await this.candidatesService.getCandidate(workspaceId, candidateId);
    const summary = await this.summaryRepo.findByIdAndCandidateId(summaryId, candidateId);
    if (!summary) {
      throw new NotFoundException(`Summary ${summaryId} not found`);
    }
    return summary;
  }
}
