export interface CandidateRecord {
  id: string;
  workspaceId: string;
  name: string;
  email: string | null;
  createdAt: Date;
}
