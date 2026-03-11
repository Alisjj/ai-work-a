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
} from '@nestjs/common';
import { Request } from 'express';

import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { CandidatesService } from '../candidates/candidates.service';
import { CreateDocumentDto } from './dto/create-document.dto';

type AuthedRequest = Request & { workspaceId: string };

@Controller('candidates/:candidateId/documents')
@UseGuards(WorkspaceGuard)
export class DocumentsController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createDocument(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Body() dto: CreateDocumentDto
  ) {
    return this.candidatesService.createDocument(req.workspaceId, candidateId, dto);
  }
}
