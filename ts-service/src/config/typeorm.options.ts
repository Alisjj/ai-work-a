import { TypeOrmModuleOptions } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";

import { SampleCandidate } from "../entities/sample-candidate.entity";
import { SampleWorkspace } from "../entities/sample-workspace.entity";
import { Candidate } from "../entities/candidate.entity";
import { CandidateDocument } from "../entities/candidate-document.entity";
import { CandidateSummary } from "../entities/candidate-summary.entity";
import { InitialStarterEntities1710000000000 } from "../migrations/1710000000000-InitialStarterEntities";
import { AddCandidateDocumentsAndSummaries1773243300000 } from "../migrations/1773243300000-AddCandidateDocumentsAndSummaries";
import { RemoveCandidateWorkspaceFk1773243300001 } from "../migrations/1773243300001-RemoveCandidateWorkspaceFk";

export const defaultDatabaseUrl =
  "postgres://assessment_user:assessment_pass@localhost:5432/assessment_db";

export const getTypeOrmOptions = (
  databaseUrl: string,
): TypeOrmModuleOptions & DataSourceOptions => ({
  type: "postgres",
  url: databaseUrl,
  entities: [SampleWorkspace, SampleCandidate, Candidate, CandidateDocument, CandidateSummary],
  migrations: [InitialStarterEntities1710000000000, AddCandidateDocumentsAndSummaries1773243300000, RemoveCandidateWorkspaceFk1773243300001],
  migrationsTableName: "typeorm_migrations",
  migrationsRun: true,
  synchronize: false,
  logging: false,
});
