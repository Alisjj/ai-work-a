import { Inject, Injectable } from '@nestjs/common';

import { CandidatesService } from '../candidates/candidates.service';
import { AuthUser } from '../auth/auth.types';
import { DOCUMENT_REPOSITORY, IDocumentRepository } from './document-repository.interface';
import { DocumentRecord } from './documents.types';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentStorageService } from './document-storage.service';

@Injectable()
export class DocumentsService {
  constructor(
    private readonly candidatesService: CandidatesService,
    private readonly documentStorageService: DocumentStorageService,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async createDocument(
    user: AuthUser,
    candidateId: string,
    dto: CreateDocumentDto,
  ): Promise<DocumentRecord> {
    await this.candidatesService.getCandidate(user.workspaceId, candidateId);

    const storageKey = await this.documentStorageService.store(
      candidateId,
      dto.fileName,
      dto.rawText,
    );

    return this.documentRepo.create({
      candidateId,
      documentType: dto.documentType,
      fileName: dto.fileName,
      storageKey,
      rawText: dto.rawText,
    });
  }
}
