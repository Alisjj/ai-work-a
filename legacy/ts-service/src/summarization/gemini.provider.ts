import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { SummarizationProvider, SummaryInput, SummaryOutput } from './summarization.interface';

const PROMPT_VERSION = 'v1';

const VALID_DECISIONS = new Set(['strong_yes', 'yes', 'maybe', 'no', 'strong_no']);

@Injectable()
export class GeminiSummarizationProvider implements SummarizationProvider {
  private readonly logger = new Logger(GeminiSummarizationProvider.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY')!;
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(this.apiKey);
  }

  async generateCandidateSummary(input: SummaryInput): Promise<SummaryOutput> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const docBlock = input.documents
      .map((d, i) => `--- Document ${i + 1}: ${d.documentType} (${d.fileName}) ---\n${d.rawText}`)
      .join('\n\n');

    const prompt = `
You are an expert technical recruiter evaluating a candidate for a software engineering role.
Review the following candidate documents and produce a structured evaluation.

${docBlock}

Respond ONLY with a valid JSON object — no markdown, no code fences, no preamble.
The JSON must conform to this exact schema:
{
  "score": <number 0-100>,
  "strengths": [<string>, ...],
  "concerns": [<string>, ...],
  "summary": "<string: 2-4 sentence overview>",
  "recommendedDecision": "<one of: strong_yes | yes | maybe | no | strong_no>"
}
`.trim();

    this.logger.debug(`Calling Gemini for candidate ${input.candidateId}`);
    const result = await model.generateContent(prompt);
    const raw = result.response.text();

    return this.parseAndValidate(raw);
  }

  private parseAndValidate(raw: string): SummaryOutput {
    let text = raw.trim();

    // Strip markdown code fences if the model added them anyway
    if (text.startsWith('```')) {
      text = text
        .replace(/^```[a-z]*\n?/, '')
        .replace(/```$/, '')
        .trim();
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error(`Gemini returned non-JSON response: ${text.slice(0, 200)}`);
    }

    const p = parsed as Record<string, unknown>;

    if (
      typeof p.score !== 'number' ||
      p.score < 0 ||
      p.score > 100 ||
      !Array.isArray(p.strengths) ||
      !Array.isArray(p.concerns) ||
      typeof p.summary !== 'string' ||
      typeof p.recommendedDecision !== 'string' ||
      !VALID_DECISIONS.has(p.recommendedDecision)
    ) {
      throw new Error(`Gemini response failed validation: ${JSON.stringify(p)}`);
    }

    return {
      score: p.score,
      strengths: p.strengths as string[],
      concerns: p.concerns as string[],
      summary: p.summary,
      recommendedDecision: p.recommendedDecision as SummaryOutput['recommendedDecision'],
    };
  }

  get promptVersion(): string {
    return PROMPT_VERSION;
  }

  get providerName(): string {
    return 'gemini-1.5-flash';
  }
}
