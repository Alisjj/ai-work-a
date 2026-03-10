import { v4 as uuidv4 } from 'uuid';
import { IDocumentRepository, DocumentRecord, CreateDocumentInput } from '../../common/interfaces';

export class InMemoryDocumentRepository implements IDocumentRepository {
    private store: DocumentRecord[] = [];

    async create(input: CreateDocumentInput): Promise<DocumentRecord> {
        const doc: DocumentRecord = {
            id: uuidv4(),
            uploadedAt: new Date(),
            ...input,
        };
        this.store.push(doc);
        return doc;
    }

    async findByCandidateId(candidateId: string): Promise<DocumentRecord[]> {
        return this.store.filter((d) => d.candidateId === candidateId);
    }
}
