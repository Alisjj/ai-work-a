import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ISummaryRepository } from '../../summaries/summary-repository.interface';
import { SummaryRecord } from '../../summaries/summaries.types';
import { CandidateSummary, SummaryStatus } from '../../entities/candidate-summary.entity';

@Injectable()
export class SummaryRepository implements ISummaryRepository {
  constructor(
    @InjectRepository(CandidateSummary)
    private readonly repository: Repository<CandidateSummary>,
  ) {}

  async findById(id: string): Promise<SummaryRecord | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toRecord(entity);
  }

  async findByIdAndCandidateId(id: string, candidateId: string): Promise<SummaryRecord | null> {
    const entity = await this.repository.findOne({ where: { id, candidateId } });
    if (!entity) return null;
    return this.toRecord(entity);
  }

  async findByCandidateId(candidateId: string): Promise<SummaryRecord[]> {
    const entities = await this.repository.find({
      where: { candidateId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toRecord(e));
  }

  async create(data: { candidateId: string; status: SummaryStatus }): Promise<SummaryRecord> {
    const entity = this.repository.create({
      candidateId: data.candidateId,
      status: data.status,
    });
    const saved = await this.repository.save(entity);
    return this.toRecord(saved);
  }

  async update(id: string, data: Partial<SummaryRecord>): Promise<SummaryRecord | null> {
    await this.repository.update(id, data);
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toRecord(entity);
  }

  private toRecord(entity: CandidateSummary): SummaryRecord {
    return {
      id: entity.id,
      candidateId: entity.candidateId,
      status: entity.status,
      score: entity.score,
      strengths: entity.strengths,
      concerns: entity.concerns,
      summary: entity.summary,
      recommendedDecision: entity.recommendedDecision,
      provider: entity.provider,
      promptVersion: entity.promptVersion,
      errorMessage: entity.errorMessage,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
