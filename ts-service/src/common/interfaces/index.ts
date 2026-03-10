export enum DocumentType {
  RESUME = 'resume',
  COVER_LETTER = 'cover_letter',
  OTHER = 'other',
}

export enum SummaryStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum RecommendedDecision {
  STRONG_YES = 'strong_yes',
  YES = 'yes',
  MAYBE = 'maybe',
  NO = 'no',
  STRONG_NO = 'strong_no',
}

export interface CandidateRecord {
    id: string;
    workspaceId: string;
    name: string;
    email: string | null;
    createdAt: Date;
}

export interface DocumentRecord {
    id: string;
    candidateId: string;
    documentType: DocumentType;
    fileName: string;
    storageKey: string;
    rawText: string;
    uploadedAt: Date;
}

export interface CreateDocumentInput {
    candidateId: string;
    documentType: DocumentType;
    fileName: string;
    storageKey: string;
    rawText: string;
}

export interface SummaryRecord {
    id: string;
    candidateId: string;
    status: SummaryStatus;
    score: number | null;
    strengths: string[] | null;
    concerns: string[] | null;
    summary: string | null;
    recommendedDecision: RecommendedDecision | null;
    provider: string | null;
    promptVersion: string | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateSummaryInput {
    candidateId: string;
    status: SummaryStatus;
    score?: number;
    strengths?: string[];
    concerns?: string[];
    summary?: string;
    recommendedDecision?: RecommendedDecision;
    provider?: string;
    promptVersion?: string;
    errorMessage?: string;
}

export interface UpdateSummaryInput {
    status?: SummaryStatus;
    score?: number;
    strengths?: string[];
    concerns?: string[];
    summary?: string;
    recommendedDecision?: RecommendedDecision;
    provider?: string;
    promptVersion?: string;
    errorMessage?: string | null;
}

export interface ICandidateRepository {
    findByIdAndWorkspace(id: string, workspaceId: string): Promise<CandidateRecord | null>;
}

export interface IDocumentRepository {
    create(input: CreateDocumentInput): Promise<DocumentRecord>;
    findByCandidateId(candidateId: string): Promise<DocumentRecord[]>;
}

export interface ISummaryRepository {
    create(input: CreateSummaryInput): Promise<SummaryRecord>;
    findById(id: string): Promise<SummaryRecord | null>;
    findByCandidateId(candidateId: string): Promise<SummaryRecord[]>;
    findByIdAndCandidateId(id: string, candidateId: string): Promise<SummaryRecord | null>;
    update(id: string, input: UpdateSummaryInput): Promise<void>;
}

export const CANDIDATE_REPOSITORY = 'CANDIDATE_REPOSITORY';
export const DOCUMENT_REPOSITORY = 'DOCUMENT_REPOSITORY';
export const SUMMARY_REPOSITORY = 'SUMMARY_REPOSITORY';
