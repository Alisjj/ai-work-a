import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { NotFoundException } from '@nestjs/common';

import { SummariesService } from './summaries.service';
import {
    CANDIDATE_REPOSITORY,
    ICandidateRepository,
    CandidateRecord,
} from '../common/repositories/candidate.repository';
import {
    SUMMARY_REPOSITORY,
    ISummaryRepository,
    SummaryRecord,
} from '../common/repositories/summary.repository';
import { SummaryStatus } from '../entities/candidate-summary.entity';
import { SUMMARY_QUEUE, SUMMARY_JOB } from './queue.constants';

const makeCandidateRecord = (override: Partial<CandidateRecord> = {}): CandidateRecord => ({
    id: 'cand-1',
    workspaceId: 'ws-1',
    name: 'Jane Doe',
    email: null,
    createdAt: new Date(),
    ...override,
});

const makeSummaryRecord = (override: Partial<SummaryRecord> = {}): SummaryRecord => ({
    id: 'sum-1',
    candidateId: 'cand-1',
    status: SummaryStatus.PENDING,
    score: null,
    strengths: null,
    concerns: null,
    summary: null,
    recommendedDecision: null,
    provider: null,
    promptVersion: null,
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...override,
});

describe('SummariesService', () => {
    let service: SummariesService;

    const candidateRepo: jest.Mocked<ICandidateRepository> = {
        findById: jest.fn(),
        findByIdAndWorkspace: jest.fn(),
        findByWorkspace: jest.fn(),
        create: jest.fn(),
    };

    const summaryRepo: jest.Mocked<ISummaryRepository> = {
        findById: jest.fn(),
        findByIdAndCandidateId: jest.fn(),
        findByCandidateId: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
    };

    const summaryQueue = {
        add: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                SummariesService,
                { provide: CANDIDATE_REPOSITORY, useValue: candidateRepo },
                { provide: SUMMARY_REPOSITORY, useValue: summaryRepo },
                { provide: getQueueToken(SUMMARY_QUEUE), useValue: summaryQueue },
            ],
        }).compile();

        service = module.get<SummariesService>(SummariesService);
    });

    describe('requestGeneration', () => {
        it('creates a pending summary and enqueues a job', async () => {
            const candidate = makeCandidateRecord();
            const summary = makeSummaryRecord();

            candidateRepo.findByIdAndWorkspace.mockResolvedValue(candidate);
            summaryRepo.create.mockResolvedValue(summary);
            summaryQueue.add.mockResolvedValue({});

            const result = await service.requestGeneration('ws-1', 'cand-1');

            expect(candidateRepo.findByIdAndWorkspace).toHaveBeenCalledWith('cand-1', 'ws-1');
            expect(summaryRepo.create).toHaveBeenCalledWith({
                candidateId: 'cand-1',
                status: SummaryStatus.PENDING,
            });
            expect(summaryQueue.add).toHaveBeenCalledWith(
                SUMMARY_JOB.GENERATE,
                { summaryId: 'sum-1', candidateId: 'cand-1' },
                expect.any(Object),
            );
            expect(result).toEqual(summary);
        });

        it('throws NotFoundException when candidate not in workspace', async () => {
            candidateRepo.findByIdAndWorkspace.mockResolvedValue(null);

            await expect(service.requestGeneration('ws-2', 'cand-1')).rejects.toThrow(
                NotFoundException,
            );
            expect(summaryRepo.create).not.toHaveBeenCalled();
            expect(summaryQueue.add).not.toHaveBeenCalled();
        });
    });

    describe('listSummaries', () => {
        it('returns summaries for a candidate', async () => {
            const candidate = makeCandidateRecord();
            const summaries = [makeSummaryRecord(), makeSummaryRecord({ id: 'sum-2' })];

            candidateRepo.findByIdAndWorkspace.mockResolvedValue(candidate);
            summaryRepo.findByCandidateId.mockResolvedValue(summaries);

            const result = await service.listSummaries('ws-1', 'cand-1');

            expect(summaryRepo.findByCandidateId).toHaveBeenCalledWith('cand-1');
            expect(result).toHaveLength(2);
        });

        it('throws NotFoundException when candidate not in workspace', async () => {
            candidateRepo.findByIdAndWorkspace.mockResolvedValue(null);

            await expect(service.listSummaries('ws-99', 'cand-1')).rejects.toThrow(NotFoundException);
        });
    });

    describe('getSummary', () => {
        it('returns a single summary', async () => {
            const candidate = makeCandidateRecord();
            const summary = makeSummaryRecord({ status: SummaryStatus.COMPLETED });

            candidateRepo.findByIdAndWorkspace.mockResolvedValue(candidate);
            summaryRepo.findByIdAndCandidateId.mockResolvedValue(summary);

            const result = await service.getSummary('ws-1', 'cand-1', 'sum-1');

            expect(summaryRepo.findByIdAndCandidateId).toHaveBeenCalledWith('sum-1', 'cand-1');
            expect(result.status).toBe(SummaryStatus.COMPLETED);
        });

        it('throws NotFoundException when summary not found', async () => {
            const candidate = makeCandidateRecord();
            candidateRepo.findByIdAndWorkspace.mockResolvedValue(candidate);
            summaryRepo.findByIdAndCandidateId.mockResolvedValue(null);

            await expect(service.getSummary('ws-1', 'cand-1', 'sum-999')).rejects.toThrow(
                NotFoundException,
            );
        });

        it('throws NotFoundException when candidate not in workspace', async () => {
            candidateRepo.findByIdAndWorkspace.mockResolvedValue(null);

            await expect(service.getSummary('ws-2', 'cand-1', 'sum-1')).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});
