import { IsArray, IsOptional, IsString } from 'class-validator';

export class ImportResourcesDto {
  @IsString()
  language: string;

  @IsString()
  fileName: string;

  @IsOptional()
  @IsString()
  source?: string = 'playwright';

  @IsArray()
  items: Record<string, unknown>[];
}
