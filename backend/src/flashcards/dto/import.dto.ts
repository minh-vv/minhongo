import { IsOptional, IsString } from 'class-validator';

export class ImportDeckDto {
  @IsString()
  deckName: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Mapping từ Anki fields sang app fields
  @IsOptional()
  @IsString()
  frontField?: string;

  @IsOptional()
  @IsString()
  backField?: string;

  @IsOptional()
  @IsString()
  romajiField?: string;

  @IsOptional()
  @IsString()
  exampleField?: string;

  @IsOptional()
  @IsString()
  tagsField?: string;
}
