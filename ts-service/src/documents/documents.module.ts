import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DocumentsController } from './documents.controller';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { Candidate } from '../entities/candidate.entity';
import { DocumentRepository, DOCUMENT_REPOSITORY } from '../common/repositories/document.repository';
import { CandidateRepository, CANDIDATE_REPOSITORY } from '../common/repositories/candidate.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CandidateDocument, Candidate])],
  controllers: [DocumentsController],
  providers: [
    DocumentRepository,
    CandidateRepository,
    {
      provide: DOCUMENT_REPOSITORY,
      useExisting: DocumentRepository,
    },
    {
      provide: CANDIDATE_REPOSITORY,
      useExisting: CandidateRepository,
    },
  ],
  exports: [DocumentRepository, CandidateRepository],
})
export class DocumentsModule {}
