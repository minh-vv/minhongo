import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { join, extname } from 'path';
import * as fs from 'fs';
import * as bcrypt from 'bcrypt';

export interface UpdateProfileInput {
  name?: string;
  learningGoal?: string;
}

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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
        ...(dto.learningGoal !== undefined && { learningGoal: dto.learningGoal }),
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
   * Lưu file avatar đã upload và cập nhật avatarUrl trong DB.
   * Xóa avatar cũ nếu tồn tại.
   */
  async updateAvatar(userId: string, filename: string, serverUrl: string) {
    // Xóa avatar cũ nếu có
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (existing?.avatarUrl) {
      try {
        const oldFilename = existing.avatarUrl.split('/uploads/avatars/').pop();
        if (oldFilename) {
          const oldPath = join(process.cwd(), 'uploads', 'avatars', oldFilename);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch {
        // Bỏ qua lỗi xóa file cũ
      }
    }

    const avatarUrl = `${serverUrl}/uploads/avatars/${filename}`;

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

    return { user: updated, avatarUrl, message: 'Ảnh đại diện đã được cập nhật' };
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

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const isValid = await bcrypt.compare(currentPassword, user.password);
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

    if (!isValid) {
      throw new UnauthorizedException('Mật khẩu hiện tại không đúng');
    }

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const hashed = await bcrypt.hash(newPassword, 10);
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { message: 'Đổi mật khẩu thành công' };
  }

  /** Xóa avatar (set về null) */
  async removeAvatar(userId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (existing?.avatarUrl) {
      try {
        const oldFilename = existing.avatarUrl.split('/uploads/avatars/').pop();
        if (oldFilename) {
          const oldPath = join(process.cwd(), 'uploads', 'avatars', oldFilename);
          if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
      } catch {
        // Bỏ qua lỗi xóa file
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
    });

    return { message: 'Đã xóa ảnh đại diện' };
  }
}
