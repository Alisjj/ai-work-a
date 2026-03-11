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
import { SummariesService } from './summaries.service';

type AuthedRequest = Request & { workspaceId: string };

@Controller('candidates/:candidateId/summaries')
@UseGuards(WorkspaceGuard)
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) {}

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  requestSummaryGeneration(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    return this.summariesService.requestGeneration(req.workspaceId, candidateId);
  }

  @Get()
  listSummaries(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    return this.summariesService.listSummaries(req.workspaceId, candidateId);
  }

  @Get(':summaryId')
  getSummary(
    @Req() req: AuthedRequest,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Param('summaryId', ParseUUIDPipe) summaryId: string,
  ) {
    return this.summariesService.getSummary(req.workspaceId, candidateId, summaryId);
  }
}
