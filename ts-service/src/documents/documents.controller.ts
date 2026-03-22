import {
  Body,
  Controller,
  Post,
  Param,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';

import { WorkspaceGuard } from '../auth/guards/workspace.guard';
import { AuthUser } from '../auth/auth-user.decorator';
import { AuthUser as AuthUserType } from '../auth/auth.types';
import { CreateDocumentDto } from './dto/create-document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@ApiSecurity('x-user-id')
@ApiSecurity('x-workspace-id')
@Controller('candidates/:candidateId/documents')
@UseGuards(WorkspaceGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

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
    return this.documentsService.createDocument(user, candidateId, dto);
  }
}
