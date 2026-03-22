import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DataSourceOptions } from 'typeorm';

import { DEFAULT_DATABASE_URL } from './env';
import { Candidate } from '../entities/candidate.entity';
import { CandidateDocument } from '../entities/candidate-document.entity';
import { CandidateSummary } from '../entities/candidate-summary.entity';
import { InitialStarterEntities1710000000000 } from '../migrations/1710000000000-InitialStarterEntities';
import { AddCandidateDocumentsAndSummaries1773243300000 } from '../migrations/1773243300000-AddCandidateDocumentsAndSummaries';
import { RemoveCandidateWorkspaceFk1773243300001 } from '../migrations/1773243300001-RemoveCandidateWorkspaceFk';
import { DropSampleStarterTables1773243300002 } from '../migrations/1773243300002-DropSampleStarterTables';

export const defaultDatabaseUrl = DEFAULT_DATABASE_URL;

export const getTypeOrmOptions = (
  databaseUrl: string,
): TypeOrmModuleOptions & DataSourceOptions => ({
  type: 'postgres',
  url: databaseUrl,
  entities: [Candidate, CandidateDocument, CandidateSummary],
  migrations: [
    InitialStarterEntities1710000000000,
    AddCandidateDocumentsAndSummaries1773243300000,
    RemoveCandidateWorkspaceFk1773243300001,
    DropSampleStarterTables1773243300002,
  ],
  migrationsTableName: 'typeorm_migrations',
  migrationsRun: true,
  synchronize: false,
  logging: false,
});
