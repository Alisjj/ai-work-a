import { ConfigService } from '@nestjs/config';

export const DEFAULT_PORT = 3000;
export const DEFAULT_DATABASE_URL =
  'postgres://assessment_user:assessment_pass@localhost:5432/assessment_db';
export const DEFAULT_REDIS_URL = 'redis://localhost:6379';

export const LLM_PROVIDER_VALUES = ['fake', 'gemini'] as const;

export type LlmProvider = (typeof LLM_PROVIDER_VALUES)[number];

export interface AppEnvironment {
  PORT: number;
  DATABASE_URL: string;
  REDIS_URL: string;
  LLM_PROVIDER: LlmProvider;
  GEMINI_API_KEY?: string;
}

function parsePort(value: unknown): number {
  const port = Number(value ?? DEFAULT_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid PORT: expected an integer between 1 and 65535, received "${value}"`);
  }
  return port;
}

function parseUrl(name: string, value: unknown, fallback: string): string {
  const resolved = String(value ?? fallback).trim();

  try {
    new URL(resolved);
  } catch {
    throw new Error(`Invalid ${name}: expected a valid URL, received "${resolved}"`);
  }

  return resolved;
}

function parseLlmProvider(value: unknown): LlmProvider {
  const provider = String(value ?? 'fake').trim().toLowerCase();

  if ((LLM_PROVIDER_VALUES as readonly string[]).includes(provider)) {
    return provider as LlmProvider;
  }

  throw new Error(
    `Invalid LLM_PROVIDER: expected one of ${LLM_PROVIDER_VALUES.join(', ')}, received "${provider}"`,
  );
}

function parseGeminiApiKey(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

export function validateEnvironment(
  rawEnv: Record<string, unknown>,
): Record<string, unknown> & AppEnvironment {
  const environment: AppEnvironment = {
    PORT: parsePort(rawEnv.PORT),
    DATABASE_URL: parseUrl('DATABASE_URL', rawEnv.DATABASE_URL, DEFAULT_DATABASE_URL),
    REDIS_URL: parseUrl('REDIS_URL', rawEnv.REDIS_URL, DEFAULT_REDIS_URL),
    LLM_PROVIDER: parseLlmProvider(rawEnv.LLM_PROVIDER),
  };

  const geminiApiKey = parseGeminiApiKey(rawEnv.GEMINI_API_KEY);
  if (geminiApiKey) {
    environment.GEMINI_API_KEY = geminiApiKey;
  }

  if (environment.LLM_PROVIDER === 'gemini' && !environment.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is required when LLM_PROVIDER=gemini');
  }

  return {
    ...rawEnv,
    ...environment,
  };
}

export function getAppEnvironment(configService: ConfigService): AppEnvironment {
  const port = configService.getOrThrow<number>('PORT', { infer: true });
  const databaseUrl = configService.getOrThrow<string>('DATABASE_URL');
  const redisUrl = configService.getOrThrow<string>('REDIS_URL');
  const llmProvider = configService.getOrThrow<LlmProvider>('LLM_PROVIDER');
  const geminiApiKey = configService.get<string>('GEMINI_API_KEY') ?? undefined;

  return {
    PORT: port,
    DATABASE_URL: databaseUrl,
    REDIS_URL: redisUrl,
    LLM_PROVIDER: llmProvider,
    ...(geminiApiKey ? { GEMINI_API_KEY: geminiApiKey } : {}),
  };
}
