import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class DropSampleStarterTables1773243300002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasSampleCandidates = await queryRunner.hasTable('sample_candidates');
    if (hasSampleCandidates) {
      await queryRunner.dropTable('sample_candidates');
    }

    const hasSampleWorkspaces = await queryRunner.hasTable('sample_workspaces');
    if (hasSampleWorkspaces) {
      await queryRunner.dropTable('sample_workspaces');
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasSampleWorkspaces = await queryRunner.hasTable('sample_workspaces');
    if (!hasSampleWorkspaces) {
      await queryRunner.createTable(
        new Table({
          name: 'sample_workspaces',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '64',
              isPrimary: true,
            },
            {
              name: 'name',
              type: 'varchar',
              length: '120',
              isNullable: false,
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
    }

    const hasSampleCandidates = await queryRunner.hasTable('sample_candidates');
    if (!hasSampleCandidates) {
      await queryRunner.createTable(
        new Table({
          name: 'sample_candidates',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '64',
              isPrimary: true,
            },
            {
              name: 'workspace_id',
              type: 'varchar',
              length: '64',
              isNullable: false,
            },
            {
              name: 'full_name',
              type: 'varchar',
              length: '160',
              isNullable: false,
            },
            {
              name: 'email',
              type: 'varchar',
              length: '160',
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
        'sample_candidates',
        new TableForeignKey({
          name: 'fk_sample_candidates_workspace_id',
          columnNames: ['workspace_id'],
          referencedTableName: 'sample_workspaces',
          referencedColumnNames: ['id'],
          onDelete: 'CASCADE',
        }),
      );

      await queryRunner.createIndex(
        'sample_candidates',
        new TableIndex({
          name: 'idx_sample_candidates_workspace_id',
          columnNames: ['workspace_id'],
        }),
      );
    }
  }
}
