import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { IDocumentRepository, DocumentRecord, CreateDocumentInput } from '../../common/interfaces';

export function toDocument(e: CandidateDocument): DocumentRecord {
  return {
    id: e.id,
    candidateId: e.candidateId,
    documentType: e.documentType,
    fileName: e.fileName,
    storageKey: e.storageKey,
    rawText: e.rawText,
    uploadedAt: e.uploadedAt,
  };
}

@Injectable()
export class TypeOrmDocumentRepository implements IDocumentRepository {
  constructor(
    @InjectRepository(CandidateDocument)
    private readonly repo: Repository<CandidateDocument>
  ) {}

  async create(input: CreateDocumentInput): Promise<DocumentRecord> {
    const entity = this.repo.create(input);
    const saved = await this.repo.save(entity);
    return toDocument(saved);
  }

  async findByCandidateId(candidateId: string): Promise<DocumentRecord[]> {
    const entities = await this.repo.find({ where: { candidateId } });
    return entities.map(toDocument);
  }
}
