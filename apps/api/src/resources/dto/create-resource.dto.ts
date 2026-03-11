import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsUrl,
} from 'class-validator';
import { ResourceType, Pricing } from '@repo/types';

export class CreateResourceDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsEnum(ResourceType)
  type: ResourceType;

  @IsString()
  @IsNotEmpty()
  language: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(Pricing)
  @IsOptional()
  pricing?: Pricing;

  @IsUrl()
  @IsOptional()
  imageUrl?: string;
}
