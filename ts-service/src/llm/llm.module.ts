import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { GeminiSummarizationProvider } from "./gemini.provider";
import { SUMMARIZATION_PROVIDER } from "./summarization-provider.interface";

@Module({
  imports: [ConfigModule],
  providers: [
    GeminiSummarizationProvider,
    {
      provide: SUMMARIZATION_PROVIDER,
      useClass: GeminiSummarizationProvider,
    },
  ],
  exports: [SUMMARIZATION_PROVIDER, GeminiSummarizationProvider],
})
export class LlmModule {}
