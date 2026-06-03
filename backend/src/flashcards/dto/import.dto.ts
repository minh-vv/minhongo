import { IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { DeckCategory } from './flashcard.dto';

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

  // Admin-only: publish settings
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  category?: DeckCategory;

  @IsOptional()
  @Transform(({ value }) => (value ? parseInt(value as string, 10) : undefined))
  @IsNumber()
  jlptLevel?: number;
}
