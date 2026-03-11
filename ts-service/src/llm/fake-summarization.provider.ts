import { Injectable } from '@nestjs/common';

import {
  CandidateSummaryInput,
  CandidateSummaryResult,
  SummarizationProvider,
} from './summarization-provider.interface';

/**
 * FakeSummarizationProvider — deterministic stub used in unit tests.
 * Must NOT be used in production. Toggle via LLM_PROVIDER env var or swap in module.
 */
@Injectable()
export class FakeSummarizationProvider implements SummarizationProvider {
  readonly providerName = 'fake';
  readonly promptVersion = 'v0-test';

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    const docCount = input.documents.length;

    return {
      score: docCount > 0 ? 72 : 40,
      strengths: ['Communicates clearly', 'Relevant project exposure'],
      concerns:
        docCount > 1
          ? ['Needs deeper system design examples']
          : ['Limited context provided'],
      summary: `Fake summary for candidate ${input.candidateId} using ${docCount} document(s).`,
      recommendedDecision: docCount > 0 ? 'yes' : 'maybe',
    };
  }
}
