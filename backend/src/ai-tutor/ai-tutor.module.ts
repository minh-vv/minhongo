import { Module } from '@nestjs/common';
import { AiTutorService } from './ai-tutor.service';
import { AiTutorController } from './ai-tutor.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AiTutorController],
  providers: [AiTutorService],
})
export class AiTutorModule {}
