import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SampleWorkspace } from './sample-workspace.entity';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'workspace_id' })
  workspaceId!: string;

  @ManyToOne(() => SampleWorkspace)
  @JoinColumn({ name: 'workspace_id' })
  workspace!: SampleWorkspace;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, nullable: true, type: 'varchar' })
  email!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
