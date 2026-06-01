import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/admin/admin.guard';
import { AttachDeckDto, SetLessonTestDto } from './dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class CoursesAdminController {
  constructor(private coursesService: CoursesService) {}

  @Get('courses')
  list() {
    return this.coursesService.adminListCourses();
  }

  @Get('courses/:slug')
  detail(@Param('slug') slug: string) {
    return this.coursesService.adminGetCourse(slug);
  }

  @Post('lessons/:id/decks')
  attachDeck(@Param('id') id: string, @Body() dto: AttachDeckDto) {
    return this.coursesService.attachDeckToLesson(id, dto);
  }

  @Delete('lessons/:id/decks/:deckId')
  detachDeck(@Param('id') id: string, @Param('deckId') deckId: string) {
    return this.coursesService.detachDeckFromLesson(id, deckId);
  }

  @Put('lessons/:id/test')
  setTest(@Param('id') id: string, @Body() dto: SetLessonTestDto) {
    return this.coursesService.setLessonTest(id, dto);
  }

  @Delete('lessons/:id/test')
  removeTest(@Param('id') id: string) {
    return this.coursesService.removeLessonTest(id);
  }
}
