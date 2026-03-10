export const SUMMARY_QUEUE = 'summary-generation';

export const SUMMARY_JOB = {
  GENERATE: 'generate-summary',
} as const;

export interface SummaryJobPayload {
  summaryId: string;
  candidateId: string;
}
