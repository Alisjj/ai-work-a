export interface DocumentRecord {
  id: string;
  candidateId: string;
  documentType: string;
  fileName: string;
  storageKey: string;
  rawText: string;
  uploadedAt: Date;
}
