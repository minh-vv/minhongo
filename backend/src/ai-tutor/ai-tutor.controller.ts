import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AiTutorService } from './ai-tutor.service';
import {
  ExplainDto,
  EvaluateDto,
  ChatDto,
  GrammarExampleDto,
} from './dto/ai-tutor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ai-tutor')
@UseGuards(JwtAuthGuard)
export class AiTutorController {
  constructor(private readonly aiTutorService: AiTutorService) {}

  @Post('explain')
  explain(@Body() explainDto: ExplainDto) {
    return this.aiTutorService.explain(explainDto);
  }

  @Post('evaluate')
  evaluate(@Body() evaluateDto: EvaluateDto) {
    return this.aiTutorService.evaluate(evaluateDto);
  }

  @Post('chat')
  chat(@Body() chatDto: ChatDto) {
    return this.aiTutorService.chat(chatDto);
  }

  @Post('grammar-example')
  generateGrammarExample(@Body() grammarExampleDto: GrammarExampleDto) {
    return this.aiTutorService.generateGrammarExample(grammarExampleDto);
  }
}
