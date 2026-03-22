import { SummaryStatus } from '../entities/candidate-summary.entity';
import { SummaryRecord } from './summaries.types';

export const SUMMARY_REPOSITORY = 'SUMMARY_REPOSITORY';

export interface ISummaryRepository {
  findById(id: string): Promise<SummaryRecord | null>;
  findByIdAndCandidateId(id: string, candidateId: string): Promise<SummaryRecord | null>;
  findByCandidateId(candidateId: string): Promise<SummaryRecord[]>;
  create(data: { candidateId: string; status: SummaryStatus }): Promise<SummaryRecord>;
  update(id: string, data: Partial<SummaryRecord>): Promise<SummaryRecord | null>;
}
