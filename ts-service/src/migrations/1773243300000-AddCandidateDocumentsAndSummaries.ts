import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class AddCandidateDocumentsAndSummaries1773243300000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create candidates table
    await queryRunner.createTable(
      new Table({
        name: 'candidates',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'workspace_id',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'email',
            type: 'varchar',
            length: '255',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'candidates',
      new TableForeignKey({
        name: 'fk_candidates_workspace_id',
        columnNames: ['workspace_id'],
        referencedTableName: 'sample_workspaces',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'candidates',
      new TableIndex({
        name: 'idx_candidates_workspace_id',
        columnNames: ['workspace_id'],
      }),
    );

    // Create candidate_documents table with enum as varchar
    await queryRunner.createTable(
      new Table({
        name: 'candidate_documents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'candidate_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'document_type',
            type: 'varchar',
            length: '50',
            default: "'resume'",
            isNullable: false,
          },
          {
            name: 'file_name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'storage_key',
            type: 'varchar',
            length: '512',
            isNullable: false,
          },
          {
            name: 'raw_text',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'uploaded_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'candidate_documents',
      new TableForeignKey({
        name: 'fk_candidate_documents_candidate_id',
        columnNames: ['candidate_id'],
        referencedTableName: 'candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'candidate_documents',
      new TableIndex({
        name: 'idx_candidate_documents_candidate_id',
        columnNames: ['candidate_id'],
      }),
    );

    // Create candidate_summaries table with enums as varchar
    await queryRunner.createTable(
      new Table({
        name: 'candidate_summaries',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            generationStrategy: 'uuid',
            default: 'gen_random_uuid()',
            isPrimary: true,
          },
          {
            name: 'candidate_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'status',
            type: 'varchar',
            length: '50',
            default: "'pending'",
            isNullable: false,
          },
          {
            name: 'score',
            type: 'float',
            isNullable: true,
          },
          {
            name: 'strengths',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'concerns',
            type: 'text',
            isArray: true,
            isNullable: true,
          },
          {
            name: 'summary',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'recommended_decision',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'prompt_version',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'error_message',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamptz',
            default: 'now()',
            isNullable: false,
          },
        ],
      }),
    );

    await queryRunner.createForeignKey(
      'candidate_summaries',
      new TableForeignKey({
        name: 'fk_candidate_summaries_candidate_id',
        columnNames: ['candidate_id'],
        referencedTableName: 'candidates',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );

    await queryRunner.createIndex(
      'candidate_summaries',
      new TableIndex({
        name: 'idx_candidate_summaries_candidate_id',
        columnNames: ['candidate_id'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('candidate_summaries', 'idx_candidate_summaries_candidate_id');
    await queryRunner.dropForeignKey('candidate_summaries', 'fk_candidate_summaries_candidate_id');
    await queryRunner.dropTable('candidate_summaries');

    await queryRunner.dropIndex('candidate_documents', 'idx_candidate_documents_candidate_id');
    await queryRunner.dropForeignKey('candidate_documents', 'fk_candidate_documents_candidate_id');
    await queryRunner.dropTable('candidate_documents');

    await queryRunner.dropIndex('candidates', 'idx_candidates_workspace_id');
    await queryRunner.dropForeignKey('candidates', 'fk_candidates_workspace_id');
    await queryRunner.dropTable('candidates');
  }
}
