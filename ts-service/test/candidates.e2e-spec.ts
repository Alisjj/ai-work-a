import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Candidates API (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // We must replicate the pipes/filters matching main.ts for accurate E2E
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    // Note: We don't necessarily manually bind the Exception filter here 
    // since the controller tests can verify the baseline behaviors, 
    // but we will test the 400 Bad Request below.
    
    await app.init();
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

  it('/sample/candidates (POST) - seeds the mock workspace', () => {
    // Calling the sample endpoint ensures the 'e2e-workspace' is created in the DB
    // avoiding the Postgres Foreign Key violations for subsequent calls
    return request(app.getHttpServer())
      .post('/sample/candidates')
      .set(headers)
      .send({ fullName: 'E2E Mock Workspace Seed' })
      .expect(201);
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
