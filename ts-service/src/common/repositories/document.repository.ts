import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { IDocumentRepository } from '../../documents/document-repository.interface';
import { DocumentRecord } from '../../documents/documents.types';
import { CandidateDocument, DocumentType } from '../../entities/candidate-document.entity';

@Injectable()
export class DocumentRepository implements IDocumentRepository {
  constructor(
    @InjectRepository(CandidateDocument)
    private readonly repository: Repository<CandidateDocument>,
  ) {}

  async findById(id: string): Promise<DocumentRecord | null> {
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) return null;
    return this.toRecord(entity);
  }

  async findByCandidateId(candidateId: string): Promise<DocumentRecord[]> {
    const entities = await this.repository.find({
      where: { candidateId },
      order: { uploadedAt: 'DESC' },
    });
    return entities.map((e) => this.toRecord(e));
  }

  async create(data: {
    candidateId: string;
    documentType: DocumentType;
    fileName: string;
    storageKey: string;
    rawText: string;
  }): Promise<DocumentRecord> {
    const entity = this.repository.create({
      candidateId: data.candidateId,
      documentType: data.documentType,
      fileName: data.fileName,
      storageKey: data.storageKey,
      rawText: data.rawText,
    });
    const saved = await this.repository.save(entity);
    return this.toRecord(saved);
  }

  private toRecord(entity: CandidateDocument): DocumentRecord {
    return {
      id: entity.id,
      candidateId: entity.candidateId,
      documentType: entity.documentType,
      fileName: entity.fileName,
      storageKey: entity.storageKey,
      rawText: entity.rawText,
      uploadedAt: entity.uploadedAt,
    };
  }
}
