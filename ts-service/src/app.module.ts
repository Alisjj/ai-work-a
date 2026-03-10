import { Module, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import * as dotenv from 'dotenv';

dotenv.config();

import { Workspace } from './auth/entities/workspace.entity';
import { Candidate } from './candidates/entities/candidate.entity';
import { CandidateDocument } from './documents/entities/candidate-document.entity';
import { CandidateSummary } from './summaries/entities/candidate-summary.entity';

import { DatabaseModule } from './database/database.module';
import { CandidatesModule } from './candidates/candidates.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/candidates_db',
      entities: [Workspace, Candidate, CandidateDocument, CandidateSummary],
      synchronize: false,
    }),
    BullModule.forRoot({
      redis: process.env.REDIS_URL || 'redis://localhost:6379',
    }),
    // Domain modules
    DatabaseModule,
    CandidatesModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
  ],
})
export class AppModule { }
