import { IsString, IsOptional, IsUrl, IsArray } from 'class-validator';
import { LanguageCode } from '@repo/types';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  learningLanguages?: LanguageCode[];
}
