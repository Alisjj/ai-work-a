import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { SummariesService } from './summaries.service';
import { SUMMARY_QUEUE } from './queue.constants';
import { SummaryProcessor } from './summary.processor';
import { SummarizationModule } from '../summarization/summarization.module';

@Module({
    imports: [
        BullModule.registerQueue({ name: SUMMARY_QUEUE }),
        SummarizationModule,
    ],
    providers: [SummariesService, SummaryProcessor],
    exports: [SummariesService],
})
export class SummariesModule { }
