import { IsEnum } from 'class-validator';

// Quality ratings cho SM-2 algorithm
// 0: Again (lặp lại ngay)
// 1: Hard (khó)
// 2: Good (tốt)
// 3: Easy (dễ)
export enum ReviewQuality {
  AGAIN = 0,
  HARD = 1,
  GOOD = 2,
  EASY = 3,
}

export class ReviewCardDto {
  @IsEnum(ReviewQuality, {
    message: 'Chất lượng phải là 0 (Again), 1 (Hard), 2 (Good), hoặc 3 (Easy)',
  })
  quality: ReviewQuality;
}
