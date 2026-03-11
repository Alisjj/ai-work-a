import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @IsString()
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string | null;
}
