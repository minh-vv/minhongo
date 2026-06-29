import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExplainDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  @IsOptional()
  context?: string;
}

export class EvaluateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500, { message: 'Câu trả lời không được vượt quá 500 ký tự' })
  userAnswer: string;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsOptional()
  expectedAnswer?: string;

  @IsString()
  @IsOptional()
  cardId?: string;
}

export class SaveExampleDto {
  @IsString()
  @IsNotEmpty()
  cardId: string;

  @IsString()
  @IsNotEmpty()
  japanese: string;

  @IsString()
  @IsOptional()
  romaji?: string;

  @IsString()
  @IsNotEmpty()
  vietnamese: string;
}

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty()
  role: 'user' | 'model';

  @IsString()
  @IsNotEmpty()
  parts: string;
}

export class ChatDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history: ChatMessageDto[];

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class GrammarExampleDto {
  @IsString()
  @IsNotEmpty()
  grammarStructure: string;

  @IsString()
  @IsNotEmpty()
  meaning: string;
}
