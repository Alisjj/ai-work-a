import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidatesModule } from '../candidates/candidates.module';
import { DOCUMENT_REPOSITORY } from './document-repository.interface';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DocumentStorageService } from './document-storage.service';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { DocumentRepository } from '../common/repositories/document.repository';

@Module({
  imports: [CandidatesModule, TypeOrmModule.forFeature([CandidateDocument])],
  controllers: [DocumentsController],
  providers: [
    DocumentsService,
    DocumentStorageService,
    DocumentRepository,
    {
      provide: DOCUMENT_REPOSITORY,
      useExisting: DocumentRepository,
    },
  ],
  exports: [DocumentsService, DocumentRepository, DOCUMENT_REPOSITORY],
})
export class DocumentsModule {}
