import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateSubStepDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
