import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CANDIDATE_REPOSITORY } from './candidate-repository.interface';
import { CandidatesController } from './candidates.controller';
import { CandidatesService } from './candidates.service';
import { Candidate } from '../entities/candidate.entity';
import { CandidateRepository } from '../common/repositories/candidate.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Candidate])],
  controllers: [CandidatesController],
  providers: [
    CandidatesService,
    CandidateRepository,
    {
      provide: CANDIDATE_REPOSITORY,
      useExisting: CandidateRepository,
    },
  ],
  exports: [CandidatesService, CandidateRepository, CANDIDATE_REPOSITORY],
})
export class CandidatesModule {}
