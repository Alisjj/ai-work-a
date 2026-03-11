import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateSummary, SummaryStatus, RecommendedDecision } from '../../entities/candidate-summary.entity';

// Re-export from candidate and document repositories for convenience
export {
  CANDIDATE_REPOSITORY,
  ICandidateRepository,
  CandidateRecord,
} from './candidate.repository';
export {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
  DocumentRecord,
} from './document.repository';

export const SUMMARY_REPOSITORY = 'SUMMARY_REPOSITORY';

export interface SummaryRecord {
  id: string;
  candidateId: string;
  status: SummaryStatus;
  score: number | null;
  strengths: string[] | null;
  concerns: string[] | null;
  summary: string | null;
  recommendedDecision: RecommendedDecision | null;
  provider: string | null;
  promptVersion: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ISummaryRepository {
  findById(id: string): Promise<SummaryRecord | null>;
  findByIdAndCandidateId(id: string, candidateId: string): Promise<SummaryRecord | null>;
  findByCandidateId(candidateId: string): Promise<SummaryRecord[]>;
  create(data: { candidateId: string; status: SummaryStatus }): Promise<SummaryRecord>;
  update(id: string, data: Partial<SummaryRecord>): Promise<SummaryRecord | null>;
}

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
