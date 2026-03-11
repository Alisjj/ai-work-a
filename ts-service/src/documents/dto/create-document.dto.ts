import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { DocumentType } from '../entities/candidate-document.entity';

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @IsString()
  @IsNotEmpty()
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  rawText!: string;
}
