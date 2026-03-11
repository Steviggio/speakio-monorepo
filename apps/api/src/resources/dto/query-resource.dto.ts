import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ResourceType, Pricing } from '@repo/types';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryResourceDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsEnum(ResourceType)
  type?: ResourceType;

  @IsOptional()
  @IsEnum(Pricing)
  pricing?: Pricing;

  @IsOptional()
  @IsString()
  tag?: string;

  @IsOptional()
  @IsString()
  sort?: 'newest' | 'oldest' | 'popular';
}
