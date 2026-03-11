import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('candidates')
export class Candidate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'workspace_id' })
  workspaceId!: string;

  @Column({ length: 255 })
  name!: string;

  @Column({ length: 255, nullable: true, type: 'varchar' })
  email!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
