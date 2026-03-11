import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateVoteDto {
  @IsString()
  @IsNotEmpty()
  resourceId: string;

  @IsEnum(['positive', 'negative'])
  type: 'positive' | 'negative';
}
