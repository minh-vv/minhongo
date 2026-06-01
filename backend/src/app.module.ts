import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { FlashcardsModule } from './flashcards/flashcards.module';
import { AdminModule } from './admin/admin.module';
import { SystemConfigModule } from './system-config/system-config.module';
import { CoursesModule } from './courses/courses.module';
import { HealthModule } from './health/health.module';
import { AiRoadmapModule } from './ai-roadmap/ai-roadmap.module';
import { AiTutorModule } from './ai-tutor/ai-tutor.module';
import { S3Module } from './s3/s3.module';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    AuthModule,
    FlashcardsModule,
    SystemConfigModule,
    AdminModule,
    CoursesModule,
    HealthModule,
    AiRoadmapModule,
    AiTutorModule,
    S3Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
