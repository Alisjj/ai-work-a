import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { createE2eApp } from './support/create-e2e-app';

const headers = {
  'x-user-id': 'e2e-user',
  'x-workspace-id': 'e2e-workspace',
};

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

describe('Summaries API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    jest.setTimeout(20000);
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  async function createCandidate(name: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/candidates')
      .set(headers)
      .send({
        name,
        email: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}@example.com`,
      })
      .expect(201);

    return response.body.id;
  }

  async function createDocument(candidateId: string, fileName: string, rawText: string): Promise<void> {
    await request(app.getHttpServer())
      .post(`/candidates/${candidateId}/documents`)
      .set(headers)
      .send({
        documentType: 'resume',
        fileName,
        rawText,
      })
      .expect(201);
  }

  async function pollSummary(candidateId: string, summaryId: string): Promise<any> {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      const response = await request(app.getHttpServer())
        .get(`/candidates/${candidateId}/summaries/${summaryId}`)
        .set(headers)
        .expect(200);

      if (response.body.status !== 'pending') {
        return response.body;
      }

      await sleep(250);
    }

    throw new Error(`Summary ${summaryId} did not finish processing in time`);
  }

  it('queues and completes summary generation for a candidate with documents', async () => {
    const candidateId = await createCandidate('Summary Success Candidate');
    await createDocument(
      candidateId,
      'resume.txt',
      'Built distributed systems, improved API latency, and led backend projects.',
    );

    const generationResponse = await request(app.getHttpServer())
      .post(`/candidates/${candidateId}/summaries/generate`)
      .set(headers)
      .expect(202);

    expect(generationResponse.body.status).toBe('pending');
    expect(generationResponse.body.candidateId).toBe(candidateId);

    const completedSummary = await pollSummary(candidateId, generationResponse.body.id);

    expect(completedSummary.status).toBe('completed');
    expect(completedSummary.provider).toBe('fake');
    expect(completedSummary.promptVersion).toBe('v0-test');
    expect(completedSummary.score).toBe(72);
    expect(completedSummary.strengths).toContain('Communicates clearly');
    expect(completedSummary.summary).toContain(candidateId);
    expect(completedSummary.errorMessage).toBeNull();
  });

  it('marks summary generation as failed when the candidate has no documents', async () => {
    const candidateId = await createCandidate('Summary Failure Candidate');

    const generationResponse = await request(app.getHttpServer())
      .post(`/candidates/${candidateId}/summaries/generate`)
      .set(headers)
      .expect(202);

    const failedSummary = await pollSummary(candidateId, generationResponse.body.id);

    expect(failedSummary.status).toBe('failed');
    expect(failedSummary.errorMessage).toBe('No documents found for candidate');
    expect(failedSummary.provider).toBeNull();
    expect(failedSummary.promptVersion).toBeNull();
  });
});
