import {
  IsOptional,
  IsString,
  IsNumber,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';
import { LessonDeckRole } from '@prisma/client';

export class EnrollDto {
  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsString()
  goal?: string;
}

export class CompleteLessonDto {
  // Điểm bài test (0-100)
  @IsNumber()
  @Min(0)
  @Max(100)
  score: number;
}

export class AttachDeckDto {
  @IsString()
  @IsNotEmpty()
  deckId: string;

  @IsOptional()
  @IsEnum(LessonDeckRole)
  role?: LessonDeckRole;

  @IsOptional()
  @IsNumber()
  order?: number;
}

export class SetLessonTestDto {
  @IsString()
  @IsNotEmpty()
  deckId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  passScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  questionCount?: number;
}
