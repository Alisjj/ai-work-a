import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import {
  ISummaryRepository,
  SummaryRecord,
  CreateSummaryInput,
  UpdateSummaryInput,
} from '../../common/interfaces';

export function toSummary(e: CandidateSummary): SummaryRecord {
  return {
    id: e.id,
    candidateId: e.candidateId,
    status: e.status,
    score: e.score,
    strengths: e.strengths,
    concerns: e.concerns,
    summary: e.summary,
    recommendedDecision: e.recommendedDecision,
    provider: e.provider,
    promptVersion: e.promptVersion,
    errorMessage: e.errorMessage,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

@Injectable()
export class TypeOrmSummaryRepository implements ISummaryRepository {
  constructor(
    @InjectRepository(CandidateSummary)
    private readonly repo: Repository<CandidateSummary>
  ) {}

  async create(input: CreateSummaryInput): Promise<SummaryRecord> {
    const entity = this.repo.create(input);
    const saved = await this.repo.save(entity);
    return toSummary(saved);
  }

  async findById(id: string): Promise<SummaryRecord | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? toSummary(entity) : null;
  }

  async findByCandidateId(candidateId: string): Promise<SummaryRecord[]> {
    const entities = await this.repo.find({
      where: { candidateId },
      order: { createdAt: 'DESC' },
    });
    return entities.map(toSummary);
  }

  async findByIdAndCandidateId(id: string, candidateId: string): Promise<SummaryRecord | null> {
    const entity = await this.repo.findOne({ where: { id, candidateId } });
    return entity ? toSummary(entity) : null;
  }

  async update(id: string, input: UpdateSummaryInput): Promise<void> {
    await this.repo.update(id, input);
  }
}
