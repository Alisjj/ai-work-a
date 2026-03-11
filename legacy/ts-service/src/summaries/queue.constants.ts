export const SUMMARY_QUEUE = 'summary-generation';

export const SUMMARY_JOB = {
  GENERATE: 'generate-summary',
} as const;

export interface SummaryJobPayload {
  summaryId: string;
  candidateId: string;
}

/**
 * Job options for production use
 * - Timeout: 60s for AI API calls
 * - Retries: 3 attempts with exponential backoff
 * - Keep completed jobs for debugging/monitoring
 */
export const SUMMARY_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  timeout: 60000, // 60 seconds
  removeOnComplete: 100, // Keep last 100 completed jobs
  removeOnFail: 1000, // Keep last 1000 failed jobs for debugging
} as const;

/**
 * Queue configuration for production
 */
export const SUMMARY_QUEUE_CONFIG = {
  name: SUMMARY_QUEUE,
  defaultJobOptions: SUMMARY_JOB_OPTIONS,
  limiter: {
    max: 10, // 10 jobs
    duration: 60000, // per 60 seconds
  },
} as const;
