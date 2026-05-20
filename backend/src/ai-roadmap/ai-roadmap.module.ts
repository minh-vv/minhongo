import { Module } from '@nestjs/common';
import { AiRoadmapController } from './ai-roadmap.controller';
import { AiRoadmapService } from './ai-roadmap.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiRoadmapController],
  providers: [AiRoadmapService],
})
export class AiRoadmapModule {}
