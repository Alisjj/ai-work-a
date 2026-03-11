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
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { Request } from 'express';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { AuthUser as AuthUserType } from '../auth/auth.types';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DOCUMENT_REPOSITORY, IDocumentRepository } from '../common/repositories/document.repository';
import { CANDIDATE_REPOSITORY, ICandidateRepository } from '../common/repositories/candidate.repository';

@ApiTags('documents')
@ApiSecurity('x-user-id')
@ApiSecurity('x-workspace-id')
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
  @ApiOperation({ summary: 'Upload a candidate document' })
  @ApiResponse({ status: 201, description: 'Document uploaded successfully' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  async createDocument(
    @AuthUser() user: AuthUserType,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    const candidate = await this.candidateRepo.findByIdAndWorkspace(
      candidateId,
      user.workspaceId,
    );
    if (!candidate) {
      throw new NotFoundException(`Candidate ${candidateId} not found`);
    }

    const uploadDir = path.join(process.cwd(), 'uploads', candidateId);
    await fs.mkdir(uploadDir, { recursive: true });

    const storageKey = path.join(uploadDir, `${randomUUID()}-${dto.fileName}`);
    await fs.writeFile(storageKey, dto.rawText, 'utf8');

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
