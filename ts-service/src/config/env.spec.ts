import {
  DEFAULT_DATABASE_URL,
  DEFAULT_REDIS_URL,
  validateEnvironment,
} from './env';

describe('validateEnvironment', () => {
  it('applies safe defaults for the service runtime', () => {
    const env = validateEnvironment({});

    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_URL).toBe(DEFAULT_DATABASE_URL);
    expect(env.REDIS_URL).toBe(DEFAULT_REDIS_URL);
    expect(env.LLM_PROVIDER).toBe('fake');
  });

  it('accepts explicit gemini mode when the API key is present', () => {
    const env = validateEnvironment({
      LLM_PROVIDER: 'gemini',
      GEMINI_API_KEY: 'test-key',
    });

    expect(env.LLM_PROVIDER).toBe('gemini');
    expect(env.GEMINI_API_KEY).toBe('test-key');
  });

  it('rejects an invalid database url', () => {
    expect(() =>
      validateEnvironment({
        DATABASE_URL: 'not-a-url',
      }),
    ).toThrow('Invalid DATABASE_URL');
  });

  it('rejects an invalid redis url', () => {
    expect(() =>
      validateEnvironment({
        REDIS_URL: 'definitely not a redis url',
      }),
    ).toThrow('Invalid REDIS_URL');
  });

  it('rejects an unsupported llm provider mode', () => {
    expect(() =>
      validateEnvironment({
        LLM_PROVIDER: 'auto',
      }),
    ).toThrow('Invalid LLM_PROVIDER');
  });

  it('requires a Gemini API key in gemini mode', () => {
    expect(() =>
      validateEnvironment({
        LLM_PROVIDER: 'gemini',
      }),
    ).toThrow('GEMINI_API_KEY is required when LLM_PROVIDER=gemini');
  });

  it('rejects an invalid port', () => {
    expect(() =>
      validateEnvironment({
        PORT: '0',
      }),
    ).toThrow('Invalid PORT');
  });
});
