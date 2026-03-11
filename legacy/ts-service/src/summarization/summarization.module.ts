import { Module } from '@nestjs/common';
import { GeminiSummarizationProvider } from './gemini.provider';
import { SUMMARIZATION_PROVIDER } from './summarization.interface';

@Module({
  providers: [
    {
      provide: SUMMARIZATION_PROVIDER,
      useClass: GeminiSummarizationProvider,
    },
  ],
  exports: [SUMMARIZATION_PROVIDER],
})
export class SummarizationModule {}
