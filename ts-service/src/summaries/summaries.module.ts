import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';
import { SummaryProcessor } from './summary.processor';
import { SUMMARY_QUEUE } from './queue.constants';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SummaryRepository, SUMMARY_REPOSITORY } from '../common/repositories/summary.repository';
import { DocumentRepository, DOCUMENT_REPOSITORY } from '../common/repositories/document.repository';
import { CandidateRepository, CANDIDATE_REPOSITORY } from '../common/repositories/candidate.repository';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { Candidate } from '../entities/candidate.entity';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    LlmModule,
    BullModule.registerQueue({
      name: SUMMARY_QUEUE,
    }),
    TypeOrmModule.forFeature([CandidateSummary, CandidateDocument, Candidate]),
  ],
  controllers: [SummariesController],
  providers: [
    SummaryProcessor,
    SummariesService,
    SummaryRepository,
    DocumentRepository,
    CandidateRepository,
    {
      provide: SUMMARY_REPOSITORY,
      useExisting: SummaryRepository,
    },
    {
      provide: DOCUMENT_REPOSITORY,
      useExisting: DocumentRepository,
    },
    {
      provide: CANDIDATE_REPOSITORY,
      useExisting: CandidateRepository,
    },
  ],
  exports: [SummariesService],
})
export class SummariesModule {}
