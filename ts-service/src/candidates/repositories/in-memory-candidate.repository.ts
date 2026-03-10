import { ICandidateRepository, CandidateRecord } from '../../common/interfaces';

export class InMemoryCandidateRepository implements ICandidateRepository {
    private store: CandidateRecord[] = [];

    seed(candidates: CandidateRecord[]): void {
        this.store = [...candidates];
    }

    async findByIdAndWorkspace(
        id: string,
        workspaceId: string,
    ): Promise<CandidateRecord | null> {
        return (
            this.store.find((c) => c.id === id && c.workspaceId === workspaceId) ?? null
        );
    }
}
