import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2eApp } from './support/create-e2e-app';

describe('Candidates API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await app.close();
  });

  const headers = {
    'x-user-id': 'e2e-user',
    'x-workspace-id': 'e2e-workspace',
  };

  it('/candidates (POST) - fails with 401 Unauthorized when missing headers', () => {
    return request(app.getHttpServer())
      .post('/candidates')
      .send({ name: 'John', email: 'john@example.com' })
      .expect(401);
  });

  let candidateId: string;

  it('/candidates (POST) - successfully creates a candidate', async () => {
    const response = await request(app.getHttpServer())
      .post('/candidates')
      .set(headers)
      .send({ name: 'E2E Candidate', email: 'e2e@example.com' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.name).toBe('E2E Candidate');
    expect(response.body.workspaceId).toBe('e2e-workspace');
    candidateId = response.body.id;
  });

  it('/candidates (GET) - lists the candidate', async () => {
    const response = await request(app.getHttpServer())
      .get('/candidates')
      .set(headers)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.some((c: any) => c.id === candidateId)).toBe(true);
  });

  it('/candidates/:id/documents (POST) - successfully uploads a document', async () => {
    const response = await request(app.getHttpServer())
      .post(`/candidates/${candidateId}/documents`)
      .set(headers)
      .send({
        documentType: 'resume',
        fileName: 'resume.pdf',
        rawText: 'E2E raw text for document',
      })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.candidateId).toBe(candidateId);
    expect(response.body.fileName).toBe('resume.pdf');
  });
});
