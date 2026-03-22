import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidatesModule } from '../candidates/candidates.module';
import { DOCUMENT_REPOSITORY } from '../documents/document-repository.interface';
import { SUMMARY_REPOSITORY } from './summary-repository.interface';
import { SummariesController } from './summaries.controller';
import { SummariesService } from './summaries.service';
import { SummaryProcessor } from './summary.processor';
import { SUMMARY_QUEUE_CONFIG } from './queue.constants';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { SummaryRepository } from '../common/repositories/summary.repository';
import { DocumentRepository } from '../common/repositories/document.repository';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [
    CandidatesModule,
    LlmModule,
    BullModule.registerQueue(SUMMARY_QUEUE_CONFIG),
    TypeOrmModule.forFeature([CandidateSummary, CandidateDocument]),
  ],
  controllers: [SummariesController],
  providers: [
    SummaryProcessor,
    SummariesService,
    SummaryRepository,
    DocumentRepository,
    {
      provide: SUMMARY_REPOSITORY,
      useExisting: SummaryRepository,
    },
    {
      provide: DOCUMENT_REPOSITORY,
      useExisting: DocumentRepository,
    },
  ],
  exports: [SummariesService],
})
export class SummariesModule {}
