import { IsString, IsNotEmpty, IsOptional, MaxLength, IsDateString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class VocabularyItemDto {
  @IsString()
  @IsNotEmpty()
  front: string;

  @IsString()
  @IsNotEmpty()
  back: string;
}

export class AddStepDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyItemDto)
  vocabularies?: VocabularyItemDto[];
}

export class AddSubStepDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsDateString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyItemDto)
  vocabularies?: VocabularyItemDto[];
}

export class UpdateVocabularyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VocabularyItemDto)
  vocabularies: VocabularyItemDto[];
}
