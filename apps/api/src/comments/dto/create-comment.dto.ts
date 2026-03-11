import { IsString, IsNotEmpty, IsEnum } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsEnum(['Resource', 'Post'])
  targetType: 'Resource' | 'Post';

  @IsString()
  @IsNotEmpty()
  targetId: string;
}
