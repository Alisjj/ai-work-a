import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class DocumentStorageService {
  async store(candidateId: string, fileName: string, rawText: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'uploads', candidateId);
    await fs.mkdir(uploadDir, { recursive: true });

    const safeFileName = path.basename(fileName);
    const storageKey = path.join(uploadDir, `${randomUUID()}-${safeFileName}`);

    await fs.writeFile(storageKey, rawText, 'utf8');
    return storageKey;
  }
}
