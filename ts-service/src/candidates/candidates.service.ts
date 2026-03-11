import { Injectable, NotFoundException } from '@nestjs/common';

import { DocumentsService } from '../documents/documents.service';
import { SummariesService } from '../summaries/summaries.service';
import { CreateDocumentDto } from '../documents/dto/create-document.dto';
import { ICandidateRepository, SummaryRecord, DocumentRecord } from '../common/interfaces';

@Injectable()
export class CandidatesService {
  constructor(
    private readonly candidateRepo: ICandidateRepository,
    private readonly documentsService: DocumentsService,
    private readonly summariesService: SummariesService
  ) {}

  private async assertCandidateOwnership(candidateId: string, workspaceId: string): Promise<void> {
    const candidate = await this.candidateRepo.findByIdAndWorkspace(candidateId, workspaceId);
    if (!candidate) {
      throw new NotFoundException(`Candidate ${candidateId} not found in your workspace`);
    }
  }

  async createDocument(
    workspaceId: string,
    candidateId: string,
    dto: CreateDocumentDto
  ): Promise<DocumentRecord> {
    await this.assertCandidateOwnership(candidateId, workspaceId);
    return this.documentsService.createDocument(workspaceId, candidateId, dto);
  }

  async requestSummaryGeneration(workspaceId: string, candidateId: string): Promise<SummaryRecord> {
    return this.summariesService.requestGeneration(workspaceId, candidateId);
  }

  async listSummaries(workspaceId: string, candidateId: string): Promise<SummaryRecord[]> {
    return this.summariesService.listSummaries(workspaceId, candidateId);
  }

  async getSummary(
    workspaceId: string,
    candidateId: string,
    summaryId: string
  ): Promise<SummaryRecord> {
    return this.summariesService.getSummary(workspaceId, candidateId, summaryId);
  }
}
