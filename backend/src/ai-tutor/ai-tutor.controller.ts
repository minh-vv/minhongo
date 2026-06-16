import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiTutorService } from './ai-tutor.service';
import {
  ExplainDto,
  EvaluateDto,
  ChatDto,
  GrammarExampleDto,
  SaveExampleDto,
} from './dto/ai-tutor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string };
}

@Controller('ai-tutor')
@UseGuards(JwtAuthGuard)
export class AiTutorController {
  constructor(private readonly aiTutorService: AiTutorService) {}

  // AI giải thích: tối đa 10 lần / phút
  @Post('explain')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  explain(@Body() explainDto: ExplainDto) {
    return this.aiTutorService.explain(explainDto);
  }

  // AI đánh giá câu: tối đa 10 lần / phút
  @Post('evaluate')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  evaluate(@Request() req: RequestWithUser, @Body() evaluateDto: EvaluateDto) {
    return this.aiTutorService.evaluate(req.user.id, evaluateDto);
  }

  // AI chat: tối đa 15 lần / phút (chat cần nhiều hơn)
  @Post('chat')
  @Throttle({ default: { ttl: 60000, limit: 15 } })
  chat(@Body() chatDto: ChatDto) {
    return this.aiTutorService.chat(chatDto);
  }

  // AI tạo ví dụ: tối đa 12 lần / phút
  @Post('grammar-example')
  @Throttle({ default: { ttl: 60000, limit: 12 } })
  generateGrammarExample(@Body() grammarExampleDto: GrammarExampleDto) {
    return this.aiTutorService.generateGrammarExample(grammarExampleDto);
  }

  // Các endpoint đọc DB không cần throttle riêng (dùng global 60/phút)
  @Get('practice-history/:cardId')
  getPracticeHistory(
    @Request() req: RequestWithUser,
    @Param('cardId') cardId: string,
  ) {
    return this.aiTutorService.getPracticeHistory(req.user.id, cardId);
  }

  @Post('save-example')
  saveExample(
    @Request() req: RequestWithUser,
    @Body() saveExampleDto: SaveExampleDto,
  ) {
    return this.aiTutorService.saveExample(req.user.id, saveExampleDto);
  }

  @Delete('save-example/:id')
  deleteSavedExample(@Request() req: RequestWithUser, @Param('id') id: string) {
    return this.aiTutorService.deleteSavedExample(req.user.id, id);
  }

  @Get('saved-examples/:cardId')
  getSavedExamples(
    @Request() req: RequestWithUser,
    @Param('cardId') cardId: string,
  ) {
    return this.aiTutorService.getSavedExamples(req.user.id, cardId);
  }
}
