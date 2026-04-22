import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';

export enum DeckCategory {
  HANTU = 'HANTU',
  TUVUNG = 'TUVUNG',
  NGUPHAP = 'NGUPHAP',
  TUHOC = 'TUHOC',
}

export class CreateDeckDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên deck là bắt buộc' })
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsEnum(DeckCategory)
  category?: DeckCategory;

  @IsOptional()
  @IsNumber()
  jlptLevel?: number;
}

export class UpdateDeckDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsEnum(DeckCategory)
  category?: DeckCategory;

  @IsOptional()
  @IsNumber()
  jlptLevel?: number;
}

export class CreateCardDto {
  @IsString()
  @IsNotEmpty({ message: 'Mặt trước thẻ là bắt buộc' })
  front: string;

  @IsString()
  @IsNotEmpty({ message: 'Mặt sau thẻ là bắt buộc' })
  back: string;

  @IsOptional()
  @IsString()
  romaji?: string;

  @IsOptional()
  @IsString()
  example?: string;

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  jlptLevel?: number;
}

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  front?: string;

  @IsOptional()
  @IsString()
  back?: string;

  @IsOptional()
  @IsString()
  romaji?: string;

  @IsOptional()
  @IsString()
  example?: string;

  @IsOptional()
  @IsString()
  audioUrl?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsNumber()
  jlptLevel?: number;
}
