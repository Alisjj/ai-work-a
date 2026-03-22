import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { getAppEnvironment } from '../config/env';
import { FakeSummarizationProvider } from './fake-summarization.provider';
import { GeminiSummarizationProvider } from './gemini.provider';
import { SUMMARIZATION_PROVIDER } from './summarization-provider.interface';

@Module({
  imports: [ConfigModule],
  providers: [
    GeminiSummarizationProvider,
    FakeSummarizationProvider,
    {
      provide: SUMMARIZATION_PROVIDER,
      inject: [ConfigService, GeminiSummarizationProvider, FakeSummarizationProvider],
      useFactory: (
        configService: ConfigService,
        geminiProvider: GeminiSummarizationProvider,
        fakeProvider: FakeSummarizationProvider,
      ) => {
        const environment = getAppEnvironment(configService);
        return environment.LLM_PROVIDER === 'gemini' ? geminiProvider : fakeProvider;
      },
    },
  ],
  exports: [SUMMARIZATION_PROVIDER, GeminiSummarizationProvider, FakeSummarizationProvider],
})
export class LlmModule {}
