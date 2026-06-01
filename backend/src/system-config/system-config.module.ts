import { Module } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';
import { SystemController } from './system.controller';

@Module({
  controllers: [SystemController],
  providers: [SystemConfigService],
  exports: [SystemConfigService],
})
export class SystemConfigModule {}
