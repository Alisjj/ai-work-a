import { CandidateRecord } from './candidates.types';

export const CANDIDATE_REPOSITORY = 'CANDIDATE_REPOSITORY';

export interface ICandidateRepository {
  findById(id: string): Promise<CandidateRecord | null>;
  findByIdAndWorkspace(
    id: string,
    workspaceId: string,
  ): Promise<CandidateRecord | null>;
  findByWorkspace(workspaceId: string): Promise<CandidateRecord[]>;
  create(data: {
    workspaceId: string;
    name: string;
    email?: string | null;
  }): Promise<CandidateRecord>;
}
