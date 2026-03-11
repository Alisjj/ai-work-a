import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DocumentType } from '../../entities/candidate-document.entity';

export class CreateDocumentDto {
  @ApiProperty({ enum: DocumentType, default: DocumentType.RESUME })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  documentType!: DocumentType;

  @ApiProperty({ example: 'resume.pdf' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileName!: string;

  @ApiProperty({ example: 'John Doe\nSenior Engineer...' })
  @IsString()
  @IsNotEmpty()
  rawText!: string;
}
