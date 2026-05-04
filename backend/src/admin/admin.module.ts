import { Module } from '@nestjs/common';
import { SystemConfigModule } from 'src/system-config/system-config.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [SystemConfigModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
