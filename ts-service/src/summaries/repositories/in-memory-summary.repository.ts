import { v4 as uuidv4 } from 'uuid';
import {
    ISummaryRepository,
    SummaryRecord,
    CreateSummaryInput,
    UpdateSummaryInput,
} from '../../common/interfaces';

export class InMemorySummaryRepository implements ISummaryRepository {
    private store: SummaryRecord[] = [];

    async create(input: CreateSummaryInput): Promise<SummaryRecord> {
        const now = new Date();
        const summary: SummaryRecord = {
            id: uuidv4(),
            score: null,
            strengths: null,
            concerns: null,
            summary: null,
            recommendedDecision: null,
            provider: null,
            promptVersion: null,
            errorMessage: null,
            createdAt: now,
            updatedAt: now,
            ...input,
        };
        this.store.push(summary);
        return summary;
    }

    async findById(id: string): Promise<SummaryRecord | null> {
        return this.store.find((s) => s.id === id) ?? null;
    }

    async findByCandidateId(candidateId: string): Promise<SummaryRecord[]> {
        return this.store
            .filter((s) => s.candidateId === candidateId)
            .sort((a, b) => {
                const timeDiff = b.createdAt.getTime() - a.createdAt.getTime();
                return timeDiff !== 0 ? timeDiff : b.id.localeCompare(a.id);
            });
    }

    async findByIdAndCandidateId(
        id: string,
        candidateId: string,
    ): Promise<SummaryRecord | null> {
        return (
            this.store.find((s) => s.id === id && s.candidateId === candidateId) ?? null
        );
    }

    async update(id: string, input: UpdateSummaryInput): Promise<void> {
        const idx = this.store.findIndex((s) => s.id === id);
        if (idx !== -1) {
            this.store[idx] = { ...this.store[idx], ...input, updatedAt: new Date() };
        }
    }
}
