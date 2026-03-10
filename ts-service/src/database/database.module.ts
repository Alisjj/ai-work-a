import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Workspace } from '../auth/entities/workspace.entity';
import { Candidate } from '../candidates/entities/candidate.entity';
import { CandidateDocument } from '../documents/entities/candidate-document.entity';
import { CandidateSummary } from '../summaries/entities/candidate-summary.entity';

import {
    CANDIDATE_REPOSITORY,
    DOCUMENT_REPOSITORY,
    SUMMARY_REPOSITORY,
} from '../repositories/interfaces';
import {
    TypeOrmCandidateRepository,
    TypeOrmDocumentRepository,
    TypeOrmSummaryRepository,
} from '../repositories/typeorm';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([
            Workspace,
            Candidate,
            CandidateDocument,
            CandidateSummary,
        ]),
    ],
    providers: [
        { provide: CANDIDATE_REPOSITORY, useClass: TypeOrmCandidateRepository },
        { provide: DOCUMENT_REPOSITORY, useClass: TypeOrmDocumentRepository },
        { provide: SUMMARY_REPOSITORY, useClass: TypeOrmSummaryRepository },
    ],
    exports: [
        TypeOrmModule,
        CANDIDATE_REPOSITORY,
        DOCUMENT_REPOSITORY,
        SUMMARY_REPOSITORY,
    ],
})
export class DatabaseModule { }
