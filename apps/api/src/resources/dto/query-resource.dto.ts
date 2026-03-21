import {
  IsBooleanString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PRICING_VALUES,
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  type Pricing,
  type ResourceStatus,
  type ResourceType,
} from '@repo/types';

export class QueryResourcesDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsIn(RESOURCE_TYPES)
  type?: ResourceType;

  @IsOptional()
  @IsIn(PRICING_VALUES)
  pricing?: Pricing;

  @IsOptional()
  @IsIn(RESOURCE_STATUSES)
  status?: ResourceStatus;

  @IsOptional()
  @IsString()
  providerDomain?: string;

  @IsOptional()
  @IsString()
  publisherSlug?: string;

  @IsOptional()
  @IsString()
  seriesSlug?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['newest', 'oldest', 'popular'])
  sort?: 'newest' | 'oldest' | 'popular';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 12;

  @IsOptional()
  @IsBooleanString()
  includeArchived?: string;
}