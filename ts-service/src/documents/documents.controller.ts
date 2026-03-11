import {
  Body,
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { randomUUID } from 'crypto';

import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DOCUMENT_REPOSITORY, IDocumentRepository } from '../common/repositories/document.repository';
import { CANDIDATE_REPOSITORY, ICandidateRepository } from '../common/repositories/candidate.repository';

type AuthedRequest = Request & { workspaceId: string };

@Controller('candidates/:candidateId/documents')
@UseGuards(WorkspaceGuard)
export class DocumentsController {
  constructor(
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepo: IDocumentRepository,
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepo: ICandidateRepository,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createDocument(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    // Verify candidate exists and belongs to workspace
    const candidate = await this.candidateRepo.findByIdAndWorkspace(
      candidateId,
      req.workspaceId,
    );
    if (!candidate) {
      throw new NotFoundException(`Candidate ${candidateId} not found`);
    }

    // Generate a storage key (in real app, this would be S3 key or similar)
    const storageKey = `candidates/${candidateId}/documents/${randomUUID()}-${dto.fileName}`;

    const document = await this.documentRepo.create({
      candidateId,
      documentType: dto.documentType,
      fileName: dto.fileName,
      storageKey,
      rawText: dto.rawText,
    });

    return document;
  }
}
