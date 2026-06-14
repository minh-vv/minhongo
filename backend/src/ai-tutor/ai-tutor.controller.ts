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

  @Post('explain')
  explain(@Body() explainDto: ExplainDto) {
    return this.aiTutorService.explain(explainDto);
  }

  @Post('evaluate')
  evaluate(
    @Request() req: RequestWithUser,
    @Body() evaluateDto: EvaluateDto,
  ) {
    return this.aiTutorService.evaluate(req.user.id, evaluateDto);
  }

  @Post('chat')
  chat(@Body() chatDto: ChatDto) {
    return this.aiTutorService.chat(chatDto);
  }

  @Post('grammar-example')
  generateGrammarExample(@Body() grammarExampleDto: GrammarExampleDto) {
    return this.aiTutorService.generateGrammarExample(grammarExampleDto);
  }

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
  deleteSavedExample(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
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
