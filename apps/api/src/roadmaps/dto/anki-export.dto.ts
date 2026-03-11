import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AnkiCardDto {
  @IsString()
  @IsNotEmpty()
  front: string;

  @IsString()
  @IsNotEmpty()
  back: string;
}

export class CreateAnkiExportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnkiCardDto)
  cards: AnkiCardDto[];
}
