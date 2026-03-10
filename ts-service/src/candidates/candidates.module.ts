import { Module } from '@nestjs/common';
import { CandidatesController } from './candidates.controller';
import { DocumentsModule } from '../documents/documents.module';
import { SummariesModule } from '../summaries/summaries.module';

@Module({
    imports: [DocumentsModule, SummariesModule],
    controllers: [CandidatesController],
})
export class CandidatesModule { }
