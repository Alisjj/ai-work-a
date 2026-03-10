import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1700000000000 implements MigrationInterface {
  name = 'InitialSchema1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "workspaces" (
        "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
        "name"       VARCHAR(255) NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_workspaces" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "candidates" (
        "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
        "workspace_id" UUID NOT NULL,
        "name"         VARCHAR(255) NOT NULL,
        "email"        VARCHAR(255),
        "created_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_candidates" PRIMARY KEY ("id"),
        CONSTRAINT "fk_candidates_workspace"
          FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_candidates_workspace_id" ON "candidates" ("workspace_id")`,
    );

    await queryRunner.query(`
      CREATE TYPE "document_type_enum" AS ENUM ('resume', 'cover_letter', 'other')
    `);

    await queryRunner.query(`
      CREATE TABLE "candidate_documents" (
        "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
        "candidate_id"  UUID NOT NULL,
        "document_type" "document_type_enum" NOT NULL DEFAULT 'resume',
        "file_name"     VARCHAR(255) NOT NULL,
        "storage_key"   VARCHAR(512) NOT NULL,
        "raw_text"      TEXT NOT NULL,
        "uploaded_at"   TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_candidate_documents" PRIMARY KEY ("id"),
        CONSTRAINT "fk_documents_candidate"
          FOREIGN KEY ("candidate_id") REFERENCES "candidates" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_candidate_documents_candidate_id" ON "candidate_documents" ("candidate_id")`,
    );

    await queryRunner.query(`
      CREATE TYPE "summary_status_enum" AS ENUM ('pending', 'completed', 'failed')
    `);

    await queryRunner.query(`
      CREATE TYPE "recommended_decision_enum"
        AS ENUM ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')
    `);

    await queryRunner.query(`
      CREATE TABLE "candidate_summaries" (
        "id"                   UUID NOT NULL DEFAULT gen_random_uuid(),
        "candidate_id"         UUID NOT NULL,
        "status"               "summary_status_enum" NOT NULL DEFAULT 'pending',
        "score"                DOUBLE PRECISION,
        "strengths"            TEXT[],
        "concerns"             TEXT[],
        "summary"              TEXT,
        "recommended_decision" "recommended_decision_enum",
        "provider"             VARCHAR(100),
        "prompt_version"       VARCHAR(50),
        "error_message"        TEXT,
        "created_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        "updated_at"           TIMESTAMPTZ NOT NULL DEFAULT now(),
        CONSTRAINT "pk_candidate_summaries" PRIMARY KEY ("id"),
        CONSTRAINT "fk_summaries_candidate"
          FOREIGN KEY ("candidate_id") REFERENCES "candidates" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "ix_candidate_summaries_candidate_id" ON "candidate_summaries" ("candidate_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "candidate_summaries"`);
    await queryRunner.query(`DROP TYPE "recommended_decision_enum"`);
    await queryRunner.query(`DROP TYPE "summary_status_enum"`);
    await queryRunner.query(`DROP TABLE "candidate_documents"`);
    await queryRunner.query(`DROP TYPE "document_type_enum"`);
    await queryRunner.query(`DROP TABLE "candidates"`);
    await queryRunner.query(`DROP TABLE "workspaces"`);
  }
}
