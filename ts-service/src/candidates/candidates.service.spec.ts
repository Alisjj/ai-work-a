import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { CANDIDATE_REPOSITORY, ICandidateRepository } from './candidate-repository.interface';
import { CandidatesService } from './candidates.service';
import { CandidateRecord } from './candidates.types';

const makeCandidateRecord = (override: Partial<CandidateRecord> = {}): CandidateRecord => ({
  id: 'cand-1',
  workspaceId: 'ws-1',
  name: 'Jane Doe',
  email: null,
  createdAt: new Date(),
  ...override,
});

describe('CandidatesService', () => {
  let service: CandidatesService;

  const candidateRepo: jest.Mocked<ICandidateRepository> = {
    findById: jest.fn(),
    findByIdAndWorkspace: jest.fn(),
    findByWorkspace: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidatesService,
        { provide: CANDIDATE_REPOSITORY, useValue: candidateRepo },
      ],
    }).compile();

    service = module.get<CandidatesService>(CandidatesService);
  });

  it('creates a candidate inside the workspace', async () => {
    const candidate = makeCandidateRecord();
    candidateRepo.create.mockResolvedValue(candidate);

    const result = await service.createCandidate('ws-1', 'Jane Doe', 'jane@example.com');

    expect(candidateRepo.create).toHaveBeenCalledWith({
      workspaceId: 'ws-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
    });
    expect(result).toEqual(candidate);
  });

  it('lists candidates for a workspace', async () => {
    const candidates = [makeCandidateRecord()];
    candidateRepo.findByWorkspace.mockResolvedValue(candidates);

    const result = await service.listCandidates('ws-1');

    expect(candidateRepo.findByWorkspace).toHaveBeenCalledWith('ws-1');
    expect(result).toEqual(candidates);
  });

  it('returns a workspace candidate when it exists', async () => {
    const candidate = makeCandidateRecord();
    candidateRepo.findByIdAndWorkspace.mockResolvedValue(candidate);

    const result = await service.getCandidate('ws-1', 'cand-1');

    expect(candidateRepo.findByIdAndWorkspace).toHaveBeenCalledWith('cand-1', 'ws-1');
    expect(result).toEqual(candidate);
  });

  it('throws when a workspace candidate does not exist', async () => {
    candidateRepo.findByIdAndWorkspace.mockResolvedValue(null);

    await expect(service.getCandidate('ws-1', 'cand-404')).rejects.toThrow(NotFoundException);
  });
});
