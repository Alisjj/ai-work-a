import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CandidatesController } from './candidates.controller';
import { Candidate } from '../entities/candidate.entity';
import { CandidateRepository, CANDIDATE_REPOSITORY } from '../common/repositories/candidate.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Candidate])],
  controllers: [CandidatesController],
  providers: [
    CandidateRepository,
    {
      provide: CANDIDATE_REPOSITORY,
      useExisting: CandidateRepository,
    },
  ],
  exports: [CandidateRepository, CANDIDATE_REPOSITORY],
})
export class CandidatesModule {}
