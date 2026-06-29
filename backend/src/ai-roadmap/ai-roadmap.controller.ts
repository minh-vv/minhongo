import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { AiRoadmapService } from './ai-roadmap.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { Request as ExpressRequest } from 'express';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string };
}

interface TestResult {
  lessonTitle: string;
  score: number;
  date?: string;
}

@Controller('ai-roadmap')
export class AiRoadmapController {
  constructor(private readonly aiRoadmapService: AiRoadmapService) {}

  @UseGuards(JwtAuthGuard)
  @Post('generate')
  async generateRoadmap(
    @Request() req: RequestWithUser,
    @Body()
    dto: {
      goal: string;
      targetMonths: number;
      minutesPerDay: number;
      currentLevel: string;
      targetJlpt?: number;
      prioritySkills?: string[];
      achievements?: string;
      testResults?: TestResult[];
    },
  ) {
    return this.aiRoadmapService.generateRoadmap(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-roadmaps')
  async getMyRoadmaps(@Request() req: RequestWithUser) {
    return this.aiRoadmapService.getMyRoadmaps(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getRoadmapById(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.aiRoadmapService.getRoadmapById(req.user.id, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('items/:itemId/complete')
  async completeItem(
    @Request() req: RequestWithUser,
    @Param('itemId') itemId: string,
  ) {
    return this.aiRoadmapService.completeItem(req.user.id, itemId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteRoadmap(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    return this.aiRoadmapService.deleteRoadmap(req.user.id, id);
  }
}
