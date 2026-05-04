import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ========== STATS ==========

  /** Thống kê nhanh cho dashboard admin */
  async getStats() {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const [totalUsers, activeUsers, blockedUsers, newToday, totalDecks] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isBlocked: false } }),
        this.prisma.user.count({ where: { isBlocked: true } }),
        this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
        this.prisma.deck.count(),
      ]);

    return { totalUsers, activeUsers, blockedUsers, newToday, totalDecks };
  }

  // ========== USER MANAGEMENT ==========

  /**
   * Lấy danh sách người dùng có phân trang, tìm kiếm và lọc trạng thái.
   */
  async getUsers(
    search?: string,
    page = 1,
    limit = 20,
    status?: string,
  ) {
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status === 'active') where.isBlocked = false;
    if (status === 'blocked') where.isBlocked = true;

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          isAdmin: true,
          isBlocked: true,
          createdAt: true,
          _count: { select: { decks: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Toggle trạng thái khóa tài khoản.
   * Admin không thể khóa chính mình hoặc admin khác.
   */
  async toggleBlockUser(userId: string, adminId: string) {
    if (userId === adminId) {
      throw new ForbiddenException('Không thể khóa tài khoản chính mình');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    if (user.isAdmin) {
      throw new ForbiddenException('Không thể khóa tài khoản admin khác');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: !user.isBlocked },
      select: { id: true, email: true, name: true, isBlocked: true },
    });

    return {
      ...updated,
      message: updated.isBlocked
        ? 'Tài khoản đã bị khóa thành công'
        : 'Tài khoản đã được mở khóa thành công',
    };
  }

  /**
   * Xóa người dùng (xóa vĩnh viễn, bao gồm tất cả decks/cards).
   * Admin không thể tự xóa mình hoặc xóa admin khác.
   */
  async deleteUser(userId: string, adminId: string) {
    if (userId === adminId) {
      throw new ForbiddenException('Không thể xóa tài khoản chính mình');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Người dùng không tồn tại');
    if (user.isAdmin) {
      throw new ForbiddenException('Không thể xóa tài khoản admin khác');
    }

    await this.prisma.user.delete({ where: { id: userId } });
    return { message: `Đã xóa tài khoản ${user.email} thành công` };
  }
}
