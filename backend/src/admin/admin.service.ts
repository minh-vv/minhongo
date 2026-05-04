import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { DeckCategory, Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import type { UpdateDeckAdminDto } from './dto/update-deck-admin.dto';

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

    const [
      totalUsers,
      activeUsers,
      blockedUsers,
      newToday,
      totalDecks,
      publicDecks,
      totalCards,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isBlocked: false } }),
      this.prisma.user.count({ where: { isBlocked: true } }),
      this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      this.prisma.deck.count(),
      this.prisma.deck.count({ where: { isPublic: true } }),
      this.prisma.card.count(),
    ]);

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      newToday,
      totalDecks,
      publicDecks,
      totalCards,
    };
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

  // ========== CONTENT (DECKS) ==========

  /**
   * Danh sách deck toàn hệ thống — duyệt / kiểm duyệt nội dung.
   */
  async getDecks(
    search?: string,
    page = 1,
    limit = 20,
    visibility?: string,
    category?: string,
  ) {
    const where: Prisma.DeckWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (visibility === 'public') where.isPublic = true;
    if (visibility === 'private') where.isPublic = false;
    if (
      category &&
      (Object.values(DeckCategory) as string[]).includes(category)
    ) {
      where.category = category as DeckCategory;
    }

    const [decks, total] = await Promise.all([
      this.prisma.deck.findMany({
        where,
        select: {
          id: true,
          name: true,
          description: true,
          isPublic: true,
          category: true,
          jlptLevel: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: { select: { id: true, email: true, name: true } },
          _count: { select: { cards: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.deck.count({ where }),
    ]);

    return {
      decks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateDeckAdmin(deckId: string, dto: UpdateDeckAdminDto) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });
    if (!deck) throw new NotFoundException('Deck không tồn tại');

    const data: Prisma.DeckUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.isPublic !== undefined) data.isPublic = dto.isPublic;
    if (dto.category !== undefined) data.category = dto.category;
    if (dto.jlptLevel !== undefined) data.jlptLevel = dto.jlptLevel;

    const updated = await this.prisma.deck.update({
      where: { id: deckId },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        isPublic: true,
        category: true,
        jlptLevel: true,
        updatedAt: true,
        user: { select: { email: true, name: true } },
        _count: { select: { cards: true } },
      },
    });

    return {
      ...updated,
      message: 'Đã cập nhật deck',
    };
  }

  /**
   * Xóa deck (cascade cards + cardProgress). Dọn log ôn tập trùng deckId.
   */
  async deleteDeckAdmin(deckId: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      select: { id: true, name: true },
    });
    if (!deck) throw new NotFoundException('Deck không tồn tại');

    await this.prisma.reviewLog.deleteMany({ where: { deckId } });
    await this.prisma.deck.delete({ where: { id: deckId } });

    return { message: `Đã xóa deck "${deck.name}" và toàn bộ thẻ liên quan` };
  }
}
