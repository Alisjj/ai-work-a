import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { DatabaseModule } from '../database/database.module';
import { SummariesService } from './summaries.service';
import { SUMMARY_QUEUE_CONFIG } from './queue.constants';
import { SummaryProcessor } from './summary.processor';
import { SummarizationModule } from '../summarization/summarization.module';
import { SummariesController } from './summaries.controller';

@Module({
  imports: [BullModule.registerQueue(SUMMARY_QUEUE_CONFIG), DatabaseModule, SummarizationModule],
  providers: [SummariesService, SummaryProcessor],
  exports: [SummariesService],
  controllers: [SummariesController],
})
export class SummariesModule {}
