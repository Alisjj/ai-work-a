export type RecommendedDecision = 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';

export interface CandidateSummaryResult {
  score: number;
  strengths: string[];
  concerns: string[];
  summary: string;
  recommendedDecision: RecommendedDecision;
}

export interface DocumentInput {
  documentType: string;
  fileName: string;
  rawText: string;
}

export interface CandidateSummaryInput {
  candidateId: string;
  documents: DocumentInput[];
}

export interface SummarizationProvider {
  readonly providerName: string;
  readonly promptVersion: string;
  generateCandidateSummary(input: CandidateSummaryInput): Promise<CandidateSummaryResult>;
}

export const SUMMARIZATION_PROVIDER = Symbol('SUMMARIZATION_PROVIDER');
