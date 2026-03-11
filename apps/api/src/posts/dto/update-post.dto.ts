import { IsString, IsOptional, IsArray, IsEnum, IsUrl } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  language?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(['draft', 'published'])
  @IsOptional()
  status?: 'draft' | 'published';

  @IsUrl()
  @IsOptional()
  coverImageUrl?: string;
}
