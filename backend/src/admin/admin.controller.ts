import {
  Body,
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { SystemConfigService } from 'src/system-config/system-config.service';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { UpdateDeckAdminDto } from './dto/update-deck-admin.dto';
import { PatchSystemSettingsDto } from './dto/patch-system-settings.dto';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string; isAdmin?: boolean };
}

/** Tất cả routes đều yêu cầu JWT hợp lệ + isAdmin = true */
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private systemConfig: SystemConfigService,
  ) {}

  // ── Stats ──────────────────────────────────────────────────────────────
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  // ── User management ────────────────────────────────────────────────────

  @Get('users')
  getUsers(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getUsers(
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      status,
    );
  }

  @Patch('users/:id/toggle-block')
  toggleBlockUser(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.adminService.toggleBlockUser(id, req.user.id);
  }

  @Delete('users/:id')
  deleteUser(
    @Param('id') id: string,
    @Request() req: RequestWithUser,
  ) {
    return this.adminService.deleteUser(id, req.user.id);
  }

  // ── Content (decks) ───────────────────────────────────────────────────

  @Get('decks')
  getDecks(
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('visibility') visibility?: string,
    @Query('category') category?: string,
  ) {
    return this.adminService.getDecks(
      search,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      visibility,
      category,
    );
  }

  @Patch('decks/:id')
  updateDeck(@Param('id') id: string, @Body() dto: UpdateDeckAdminDto) {
    return this.adminService.updateDeckAdmin(id, dto);
  }

  @Delete('decks/:id')
  deleteDeck(@Param('id') id: string) {
    return this.adminService.deleteDeckAdmin(id);
  }

  // ── System settings ─────────────────────────────────────────────────────

  @Get('settings')
  getSettings() {
    return this.systemConfig.getAllSettings();
  }

  @Patch('settings')
  patchSettings(@Body() dto: PatchSystemSettingsDto) {
    return this.systemConfig.patchSettings(dto);
  }
}
