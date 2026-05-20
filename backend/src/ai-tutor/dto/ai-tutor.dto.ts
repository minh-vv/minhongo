import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
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
  userAnswer: string;

  @IsString()
  @IsNotEmpty()
  question: string;

  @IsString()
  @IsOptional()
  expectedAnswer?: string;
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
