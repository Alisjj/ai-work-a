import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';

import { AuthModule } from './auth/auth.module';
import { getAppEnvironment, validateEnvironment } from './config/env';
import { getTypeOrmOptions } from './config/typeorm.options';
import { HealthModule } from './health/health.module';
import { LlmModule } from './llm/llm.module';
import { CandidatesModule } from './candidates/candidates.module';
import { DocumentsModule } from './documents/documents.module';
import { SummariesModule } from './summaries/summaries.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmOptions(getAppEnvironment(configService).DATABASE_URL),
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const environment = getAppEnvironment(configService);

        return {
          redis: environment.REDIS_URL,
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 2000 },
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    HealthModule,
    LlmModule,
    CandidatesModule,
    DocumentsModule,
    SummariesModule,
  ],
})
export class AppModule {}
