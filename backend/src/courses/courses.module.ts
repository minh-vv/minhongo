import { Module } from '@nestjs/common';
import { CoursesController } from './courses.controller';
import { CoursesAdminController } from './courses-admin.controller';
import { CoursesService } from './courses.service';

@Module({
  providers: [CoursesService],
  controllers: [CoursesController, CoursesAdminController],
  exports: [CoursesService],
})
export class CoursesModule {}
