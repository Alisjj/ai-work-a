import { DocumentType } from '../entities/candidate-document.entity';
import { DocumentRecord } from './documents.types';

export const DOCUMENT_REPOSITORY = 'DOCUMENT_REPOSITORY';

export interface IDocumentRepository {
  findById(id: string): Promise<DocumentRecord | null>;
  findByCandidateId(candidateId: string): Promise<DocumentRecord[]>;
  create(data: {
    candidateId: string;
    documentType: DocumentType;
    fileName: string;
    storageKey: string;
    rawText: string;
  }): Promise<DocumentRecord>;
}
