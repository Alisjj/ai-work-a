import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [DatabaseModule],
  providers: [DocumentsService],
  exports: [DocumentsService],
  controllers: [DocumentsController],
})
export class DocumentsModule {}
