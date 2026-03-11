import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { DocumentType } from '../../entities/candidate-document.entity';

export class CreateDocumentDto {
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType!: DocumentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @IsString()
  @IsNotEmpty()
  rawText!: string;
}
