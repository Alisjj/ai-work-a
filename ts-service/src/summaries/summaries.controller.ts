import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

import { AuthUser } from '../auth/auth-user.decorator';
import { AuthUser as AuthUserType } from '../auth/auth.types';
import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { SummariesService } from './summaries.service';

@ApiTags('summaries')
@ApiSecurity('x-user-id')
@ApiSecurity('x-workspace-id')
@Controller('candidates/:candidateId/summaries')
@UseGuards(WorkspaceGuard)
export class SummariesController {
  constructor(private readonly summariesService: SummariesService) { }

  @Post('generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Queue summary generation for a candidate' })
  @ApiResponse({ status: 202, description: 'Summary generation queued' })
  requestSummaryGeneration(
    @AuthUser() user: AuthUserType,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    return this.summariesService.requestGeneration(user.workspaceId, candidateId);
  }

  @Get()
  @ApiOperation({ summary: 'List all summaries for a candidate' })
  @ApiResponse({ status: 200, description: 'List of summaries' })
  listSummaries(
    @AuthUser() user: AuthUserType,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
  ) {
    return this.summariesService.listSummaries(user.workspaceId, candidateId);
  }

  @Get(':summaryId')
  @ApiOperation({ summary: 'Get a single summary' })
  @ApiResponse({ status: 200, description: 'Summary details' })
  getSummary(
    @AuthUser() user: AuthUserType,
    @Param('candidateId', ParseUUIDPipe) candidateId: string,
    @Param('summaryId', ParseUUIDPipe) summaryId: string,
  ) {
    return this.summariesService.getSummary(user.workspaceId, candidateId, summaryId);
  }
}
