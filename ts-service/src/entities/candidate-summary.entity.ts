import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Candidate } from './candidate.entity';

export enum SummaryStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum RecommendedDecision {
  STRONG_YES = 'strong_yes',
  YES = 'yes',
  MAYBE = 'maybe',
  NO = 'no',
  STRONG_NO = 'strong_no',
}

@Entity('candidate_summaries')
export class CandidateSummary {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'candidate_id' })
  candidateId!: string;

  @ManyToOne(() => Candidate)
  @JoinColumn({ name: 'candidate_id' })
  candidate!: Candidate;

  @Column({
    type: 'varchar',
    length: 50,
    default: SummaryStatus.PENDING,
  })
  status!: SummaryStatus;

  @Column({ type: 'float', nullable: true })
  score!: number | null;

  @Column({ type: 'text', array: true, nullable: true })
  strengths!: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  concerns!: string[] | null;

  @Column({ type: 'text', nullable: true })
  summary!: string | null;

  @Column({
    name: 'recommended_decision',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  recommendedDecision!: RecommendedDecision | null;

  @Column({ name: 'provider', type: 'varchar', length: 100, nullable: true })
  provider!: string | null;

  @Column({ name: 'prompt_version', type: 'varchar', length: 50, nullable: true })
  promptVersion!: string | null;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
