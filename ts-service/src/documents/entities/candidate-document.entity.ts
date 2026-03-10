import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Candidate } from '../../candidates/entities/candidate.entity';

export enum DocumentType {
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
  OTHER = 'other',
}

@Entity('candidate_documents')
export class CandidateDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'candidate_id' })
  candidateId: string;

  @ManyToOne(() => Candidate)
  @JoinColumn({ name: 'candidate_id' })
  candidate: Candidate;

  @Column({
    name: 'document_type',
    type: 'enum',
    enum: DocumentType,
    default: DocumentType.RESUME,
  })
  documentType: DocumentType;

  @Column({ name: 'file_name', length: 255 })
  fileName: string;

  @Column({ name: 'storage_key', length: 512 })
  storageKey: string;

  @Column({ name: 'raw_text', type: 'text' })
  rawText: string;

  @CreateDateColumn({ name: 'uploaded_at', type: 'timestamptz' })
  uploadedAt: Date;
}
