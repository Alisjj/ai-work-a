import { Module } from '@nestjs/common';

import { CandidatesService } from './candidates.service';
import { DatabaseModule } from '../database/database.module';
import { DocumentsModule } from '../documents/documents.module';
import { SummariesModule } from '../summaries/summaries.module';

@Module({
  imports: [DatabaseModule, DocumentsModule, SummariesModule],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
