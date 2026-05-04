import { Controller, Get } from '@nestjs/common';
import { SystemConfigService } from './system-config.service';

/** Endpoint công khai — không cần đăng nhập (banner, cờ đăng ký, v.v.) */
@Controller('system')
export class SystemController {
  constructor(private systemConfig: SystemConfigService) {}

  @Get('public-config')
  getPublicConfig() {
    return this.systemConfig.getPublicConfig();
  }
}
