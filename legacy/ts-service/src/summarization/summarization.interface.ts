export const SUMMARIZATION_PROVIDER = 'SUMMARIZATION_PROVIDER';

export interface SummaryInput {
  candidateId: string;
  documents: Array<{ documentType: string; fileName: string; rawText: string }>;
}

export interface SummaryOutput {
  score: number;
  strengths: string[];
  concerns: string[];
  summary: string;
  recommendedDecision: 'strong_yes' | 'yes' | 'maybe' | 'no' | 'strong_no';
}

export interface SummarizationProvider {
  readonly providerName: string;
  readonly promptVersion: string;
  generateCandidateSummary(input: SummaryInput): Promise<SummaryOutput>;
}
