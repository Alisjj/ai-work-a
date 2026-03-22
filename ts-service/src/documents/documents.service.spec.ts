import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { CandidatesService } from '../candidates/candidates.service';
import { DOCUMENT_REPOSITORY, IDocumentRepository } from './document-repository.interface';
import { DocumentStorageService } from './document-storage.service';
import { DocumentsService } from './documents.service';
import { DocumentType } from '../entities/candidate-document.entity';
import { DocumentRecord } from './documents.types';

const makeDocumentRecord = (override: Partial<DocumentRecord> = {}): DocumentRecord => ({
  id: 'doc-1',
  candidateId: 'cand-1',
  documentType: DocumentType.RESUME,
  fileName: 'resume.pdf',
  storageKey: '/tmp/uploads/cand-1/file.pdf',
  rawText: 'resume text',
  uploadedAt: new Date(),
  ...override,
});

describe('DocumentsService', () => {
  let service: DocumentsService;

  const candidatesService = {
    getCandidate: jest.fn(),
  };

  const documentStorageService = {
    store: jest.fn(),
  };

  const documentRepo: jest.Mocked<IDocumentRepository> = {
    findById: jest.fn(),
    findByCandidateId: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentsService,
        { provide: CandidatesService, useValue: candidatesService },
        { provide: DocumentStorageService, useValue: documentStorageService },
        { provide: DOCUMENT_REPOSITORY, useValue: documentRepo },
      ],
    }).compile();

    service = module.get<DocumentsService>(DocumentsService);
  });

  it('creates a document after verifying candidate ownership', async () => {
    const document = makeDocumentRecord();
    candidatesService.getCandidate.mockResolvedValue({
      id: 'cand-1',
      workspaceId: 'ws-1',
      name: 'Jane Doe',
      email: null,
      createdAt: new Date(),
    });
    documentStorageService.store.mockResolvedValue('/tmp/uploads/cand-1/resume.pdf');
    documentRepo.create.mockResolvedValue(document);

    const result = await service.createDocument(
      { userId: 'user-1', workspaceId: 'ws-1' },
      'cand-1',
      {
        documentType: DocumentType.RESUME,
        fileName: 'resume.pdf',
        rawText: 'resume text',
      },
    );

    expect(candidatesService.getCandidate).toHaveBeenCalledWith('ws-1', 'cand-1');
    expect(documentStorageService.store).toHaveBeenCalledWith(
      'cand-1',
      'resume.pdf',
      'resume text',
    );
    expect(documentRepo.create).toHaveBeenCalledWith({
      candidateId: 'cand-1',
      documentType: DocumentType.RESUME,
      fileName: 'resume.pdf',
      storageKey: '/tmp/uploads/cand-1/resume.pdf',
      rawText: 'resume text',
    });
    expect(result).toEqual(document);
  });

  it('bubbles candidate ownership errors', async () => {
    candidatesService.getCandidate.mockRejectedValue(new NotFoundException('missing'));

    await expect(
      service.createDocument(
        { userId: 'user-1', workspaceId: 'ws-1' },
        'cand-404',
        {
          documentType: DocumentType.RESUME,
          fileName: 'resume.pdf',
          rawText: 'resume text',
        },
      ),
    ).rejects.toThrow(NotFoundException);

    expect(documentStorageService.store).not.toHaveBeenCalled();
    expect(documentRepo.create).not.toHaveBeenCalled();
  });
});
