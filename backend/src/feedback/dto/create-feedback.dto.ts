import { IsEnum, IsString, MinLength } from 'class-validator';

export enum FeedbackType {
  BUG = 'BUG',
  FEATURE = 'FEATURE',
  CONTENT = 'CONTENT',
  UI_UX = 'UI_UX',
  OTHER = 'OTHER',
}

export class CreateFeedbackDto {
  @IsEnum(FeedbackType)
  type: FeedbackType;

  @IsString()
  @MinLength(10, { message: 'Nội dung phản hồi phải có ít nhất 10 ký tự' })
  message: string;
}
