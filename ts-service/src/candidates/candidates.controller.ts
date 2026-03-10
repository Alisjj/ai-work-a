import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { DocumentsService } from '../documents/documents.service';
import { SummariesService } from '../summaries/summaries.service';
import { CreateDocumentDto } from '../documents/dto/create-document.dto';

type AuthedRequest = Request & { workspaceId: string };

@Controller('candidates')
@UseGuards(WorkspaceGuard)
export class CandidatesController {
  constructor(
    private readonly documentsService: DocumentsService,
    private readonly summariesService: SummariesService,
  ) { }

  // POST /candidates/:candidateId/documents
  @Post(':candidateId/documents')
  @HttpCode(HttpStatus.CREATED)
  createDocument(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() dto: CreateDocumentDto,
  ) {
    return this.documentsService.createDocument(req.workspaceId, candidateId, dto);
  }

  // POST /candidates/:candidateId/summaries/generate
  @Post(':candidateId/summaries/generate')
  @HttpCode(HttpStatus.ACCEPTED)
  requestSummaryGeneration(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    return this.summariesService.requestGeneration(req.workspaceId, candidateId);
  }

  // GET /candidates/:candidateId/summaries
  @Get(':candidateId/summaries')
  listSummaries(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    return this.summariesService.listSummaries(req.workspaceId, candidateId);
  }

  // GET /candidates/:candidateId/summaries/:summaryId
  @Get(':candidateId/summaries/:summaryId')
  getSummary(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Param('summaryId', ParseUUIDPipe) summaryId: string,
  ) {
    return this.summariesService.getSummary(req.workspaceId, candidateId, summaryId);
  }
}
