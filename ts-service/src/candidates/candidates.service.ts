import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { CANDIDATE_REPOSITORY, ICandidateRepository } from './candidate-repository.interface';
import { CandidateRecord } from './candidates.types';

@Injectable()
export class CandidatesService {
  constructor(
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepo: ICandidateRepository,
  ) {}

  createCandidate(workspaceId: string, name: string, email?: string | null): Promise<CandidateRecord> {
    return this.candidateRepo.create({
      workspaceId,
      name,
      email,
    });
  }

  listCandidates(workspaceId: string): Promise<CandidateRecord[]> {
    return this.candidateRepo.findByWorkspace(workspaceId);
  }

  async getCandidate(workspaceId: string, candidateId: string): Promise<CandidateRecord> {
    const candidate = await this.candidateRepo.findByIdAndWorkspace(candidateId, workspaceId);
    if (!candidate) {
      throw new NotFoundException(`Candidate ${candidateId} not found`);
    }
    return candidate;
  }
}
