import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CreateDocumentDto } from './dto/create-document.dto';
import {
  CANDIDATE_REPOSITORY,
  DOCUMENT_REPOSITORY,
  ICandidateRepository,
  IDocumentRepository,
  DocumentRecord,
} from '../repositories/interfaces';

@Injectable()
export class DocumentsService {
  constructor(
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepo: ICandidateRepository,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async createDocument(
    workspaceId: string,
    candidateId: string,
    dto: CreateDocumentDto,
  ): Promise<DocumentRecord> {
    const candidate = await this.candidateRepo.findByIdAndWorkspace(
      candidateId,
      workspaceId,
    );
    if (!candidate) {
      throw new NotFoundException(
        `Candidate ${candidateId} not found in your workspace`,
      );
    }

    const storageKey = `workspaces/${workspaceId}/candidates/${candidateId}/documents/${Date.now()}-${dto.fileName}`;

    return this.documentRepo.create({
      candidateId,
      documentType: dto.documentType,
      fileName: dto.fileName,
      storageKey,
      rawText: dto.rawText,
    });
  }
}
