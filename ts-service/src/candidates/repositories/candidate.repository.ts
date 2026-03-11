import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Candidate } from '../entities/candidate.entity';
import { ICandidateRepository, CandidateRecord } from '../../common/interfaces';

export function toCandidate(e: Candidate): CandidateRecord {
  return {
    id: e.id,
    workspaceId: e.workspaceId,
    name: e.name,
    email: e.email ?? null,
    createdAt: e.createdAt,
  };
}

@Injectable()
export class TypeOrmCandidateRepository implements ICandidateRepository {
  constructor(
    @InjectRepository(Candidate)
    private readonly repo: Repository<Candidate>
  ) {}

  async findByIdAndWorkspace(id: string, workspaceId: string): Promise<CandidateRecord | null> {
    const entity = await this.repo.findOne({ where: { id, workspaceId } });
    return entity ? toCandidate(entity) : null;
  }
}
