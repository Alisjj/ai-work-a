import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Req,
  UseGuards,
  Post,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { CandidatesService } from '../candidates/candidates.service';

type AuthedRequest = Request & { workspaceId: string };

@Controller('candidates/:candidateId/summaries')
@UseGuards(WorkspaceGuard)
export class SummariesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  requestSummaryGeneration(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string
  ) {
    return this.candidatesService.requestSummaryGeneration(req.workspaceId, candidateId);
  }

  @Get()
  listSummaries(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string
  ) {
    return this.candidatesService.listSummaries(req.workspaceId, candidateId);
  }

  @Get(':summaryId')
  getSummary(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Param('summaryId', ParseUUIDPipe) summaryId: string
  ) {
    return this.candidatesService.getSummary(req.workspaceId, candidateId, summaryId);
  }
}
