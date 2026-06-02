import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/s3/s3.service';
import * as bcrypt from 'bcrypt';

export interface UpdateProfileInput {
  name?: string;
  learningGoal?: string;
}

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

  /** Lấy thông tin profile của user hiện tại (không bao gồm mật khẩu) */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        learningGoal: true,
        isAdmin: true,
        createdAt: true,
        _count: { select: { decks: true } },
      },
    });

    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    return user;
  }

  /** Cập nhật tên và mục tiêu học tập */
  async updateProfile(userId: string, dto: UpdateProfileInput) {
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.learningGoal !== undefined && {
          learningGoal: dto.learningGoal,
        }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        learningGoal: true,
        isAdmin: true,
      },
    });

    return { user: updated, message: 'Cập nhật hồ sơ thành công' };
  }

  /**
   * Upload avatar lên S3, xóa ảnh cũ trên S3 nếu có.
   */
  async updateAvatar(
    userId: string,
    buffer: Buffer,
    mimetype: string,
    ext: string,
  ) {
    // Xóa avatar cũ trên S3 nếu có
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (existing?.avatarUrl) {
      const oldKey = this.s3.extractKey(existing.avatarUrl);
      if (oldKey) await this.s3.delete(oldKey);
    }

    // Upload ảnh mới lên S3
    const key = `avatars/${userId}${ext}`;
    const avatarUrl = await this.s3.upload(key, buffer, mimetype);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        learningGoal: true,
        isAdmin: true,
      },
    });

    return {
      user: updated,
      avatarUrl,
      message: 'Ảnh đại diện đã được cập nhật',
    };
  }

  /**
   * Đổi mật khẩu khi đang đăng nhập.
   * Yêu cầu xác nhận mật khẩu hiện tại trước khi cho đổi.
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    if (newPassword.length < 6) {
      throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');

    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  /** Xóa avatar: xóa khỏi S3 và set về null trong DB */
  async removeAvatar(userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (existing?.avatarUrl) {
      const key = this.s3.extractKey(existing.avatarUrl);
      if (key) await this.s3.delete(key);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    return { message: 'Đã xóa ảnh đại diện' };
  }
}
