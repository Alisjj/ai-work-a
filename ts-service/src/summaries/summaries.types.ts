import { RecommendedDecision, SummaryStatus } from '../entities/candidate-summary.entity';

export interface SummaryRecord {
  id: string;
  candidateId: string;
  status: SummaryStatus;
  score: number | null;
  strengths: string[] | null;
  concerns: string[] | null;
  summary: string | null;
  recommendedDecision: RecommendedDecision | null;
  provider: string | null;
  promptVersion: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}
