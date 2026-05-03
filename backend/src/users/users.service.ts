import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { join, extname } from 'path';
import * as fs from 'fs';

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
