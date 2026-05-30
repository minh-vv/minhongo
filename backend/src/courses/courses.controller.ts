import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { EnrollDto, CompleteLessonDto } from './dto';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string; isAdmin?: boolean };
}

@Controller()
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  // ========== COURSES ==========

  @UseGuards(JwtAuthGuard)
  @Get('courses')
  listCourses(@Request() req: RequestWithUser) {
    return this.coursesService.listCourses(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/courses')
  myCourses(@Request() req: RequestWithUser) {
    return this.coursesService.myCourses(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/current-lesson')
  getCurrentLesson(@Request() req: RequestWithUser) {
    return this.coursesService.getCurrentLesson(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('courses/:slug')
  getCourse(@Param('slug') slug: string, @Request() req: RequestWithUser) {
    return this.coursesService.getCourseBySlug(slug, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('courses/:slug/enroll')
  enroll(
    @Param('slug') slug: string,
    @Request() req: RequestWithUser,
    @Body() dto: EnrollDto,
  ) {
    return this.coursesService.enroll(slug, req.user.id, dto);
  }

  // ========== LESSONS ==========

  @UseGuards(JwtAuthGuard)
  @Get('lessons/:id')
  getLesson(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.coursesService.getLessonById(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('lessons/:id/start')
  startLesson(@Param('id') id: string, @Request() req: RequestWithUser) {
    return this.coursesService.startLesson(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('lessons/:id/complete')
  completeLesson(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
    @Body() dto: CompleteLessonDto,
  ) {
    return this.coursesService.completeLesson(id, req.user.id, dto.score);
  }
}
