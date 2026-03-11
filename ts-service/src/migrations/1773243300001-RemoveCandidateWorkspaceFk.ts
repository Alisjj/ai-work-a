import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveCandidateWorkspaceFk1773243300001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropForeignKey('candidates', 'fk_candidates_workspace_id');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "candidates" 
      ADD CONSTRAINT "fk_candidates_workspace_id" 
      FOREIGN KEY ("workspace_id") REFERENCES "sample_workspaces"("id") ON DELETE CASCADE
    `);
  }
}
