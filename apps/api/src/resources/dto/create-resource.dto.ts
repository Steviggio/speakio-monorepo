import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PRICING_VALUES,
  RESOURCE_FORMATS,
  RESOURCE_LEVELS,
  RESOURCE_ORIGINS,
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  type Pricing,
  type ResourceFormat,
  type ResourceLevel,
  type ResourceOrigin,
  type ResourceStatus,
  type ResourceType,
} from '@repo/types';

class SourcePlatformDto {
  @IsString()
  domain: string;

  @IsString()
  rootDomain: string;

  @IsUrl()
  baseUrl: string;

  @IsString()
  label: string;
}

class PublisherRefDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

class SeriesRefDto {
  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  name?: string;
}

class SourceMetadataDto {
  @IsIn(RESOURCE_ORIGINS)
  origin: ResourceOrigin;

  @IsOptional()
  @IsString()
  importBatchId?: string;

  @IsOptional()
  @IsString()
  rawFileName?: string;

  @IsOptional()
  @IsString()
  rawTitle?: string;
}

export class CreateResourceDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsUrl()
  url: string;

  @IsIn(RESOURCE_TYPES)
  type: ResourceType;

  @IsString()
  language: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsIn(PRICING_VALUES)
  pricing: Pricing;

  @IsOptional()
  @ValidateNested()
  @Type(() => SourcePlatformDto)
  sourcePlatform?: SourcePlatformDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => PublisherRefDto)
  publisher?: PublisherRefDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => SeriesRefDto)
  series?: SeriesRefDto;

  @IsOptional()
  @IsArray()
  @IsIn(RESOURCE_LEVELS, { each: true })
  levels?: ResourceLevel[];

  @IsOptional()
  @IsArray()
  @IsIn(RESOURCE_FORMATS, { each: true })
  formats?: ResourceFormat[];

  @IsOptional()
  @IsIn(RESOURCE_STATUSES)
  status?: ResourceStatus;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => SourceMetadataDto)
  sourceMetadata?: SourceMetadataDto;

  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  authorOrPublisher?: string;
}
