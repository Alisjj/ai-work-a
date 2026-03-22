import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ICandidateRepository } from '../../candidates/candidate-repository.interface';
import { CandidateRecord } from '../../candidates/candidates.types';
import { Candidate } from '../../entities/candidate.entity';

@Injectable()
export class CandidateRepository implements ICandidateRepository {
  constructor(
    @InjectRepository(Candidate)
    private readonly repository: Repository<Candidate>,
  ) {}

  async findById(id: string): Promise<CandidateRecord | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toRecord(entity);
  }

  async findByIdAndWorkspace(
    id: string,
    workspaceId: string,
  ): Promise<CandidateRecord | null> {
    const entity = await this.repository.findOne({
      where: { id, workspaceId },
    });
    if (!entity) return null;
    return this.toRecord(entity);
  }

  async findByWorkspace(workspaceId: string): Promise<CandidateRecord[]> {
    const entities = await this.repository.find({
      where: { workspaceId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toRecord(e));
  }

  async create(data: {
    workspaceId: string;
    name: string;
    email?: string | null;
  }): Promise<CandidateRecord> {
    const entity = this.repository.create({
      workspaceId: data.workspaceId,
      name: data.name,
      email: data.email ?? null,
    });
    const saved = await this.repository.save(entity);
    return this.toRecord(saved);
  }

  private toRecord(entity: Candidate): CandidateRecord {
    return {
      id: entity.id,
      workspaceId: entity.workspaceId,
      name: entity.name,
      email: entity.email,
      createdAt: entity.createdAt,
    };
  }
}
