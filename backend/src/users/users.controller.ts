import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { extname } from 'path';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  learningGoal?: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string; isAdmin?: boolean };
}

/** Multer: giữ file trong memory, upload lên S3 sau */
const avatarMemoryStorage = memoryStorage();

function imageFileFilter(
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) {
  if (!file.mimetype.match(/^image\/(jpeg|png|webp|gif)$/)) {
    cb(new BadRequestException('Chỉ chấp nhận file ảnh (jpg, png, webp, gif)'), false);
    return;
  }
  cb(null, true);
}

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ── Profile ──────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: RequestWithUser) {
    return this.usersService.getProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(
    @Request() req: RequestWithUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(req.user.id, dto);
  }

  @Post('me/change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @Request() req: RequestWithUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(
      req.user.id,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  // ── Avatar ───────────────────────────────────────────────────────────

  @Patch('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: avatarMemoryStorage,
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: imageFileFilter,
    }),
  )
  uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: RequestWithUser,
  ) {
    if (!file) throw new BadRequestException('Vui lòng chọn file ảnh');
    const ext = extname(file.originalname).toLowerCase();
    return this.usersService.updateAvatar(req.user.id, file.buffer, file.mimetype, ext);
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  removeAvatar(@Request() req: RequestWithUser) {
    return this.usersService.removeAvatar(req.user.id);
  }
}
