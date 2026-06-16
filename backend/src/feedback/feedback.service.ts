import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { S3Service } from 'src/s3/s3.service';
import { FeedbackType } from './dto/create-feedback.dto';
import { FeedbackStatus } from './dto/update-feedback.dto';

@Injectable()
export class FeedbackService {
  private readonly logger = new Logger(FeedbackService.name);

  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) { }

  // ── User: Gửi feedback mới ──────────────────────────────────────────────
  async createFeedback(
    userId: string,
    type: FeedbackType,
    message: string,
    files?: Express.Multer.File[],
  ) {
    // Tạo feedback trước để lấy ID cho S3 key
    const feedback = await this.prisma.feedback.create({
      data: { userId, type, message, imageUrls: [] },
    });

    // Upload ảnh nếu có
    if (files && files.length > 0) {
      const imageUrls: string[] = [];
      for (const file of files.slice(0, 3)) {
        const ext = file.originalname.split('.').pop() || 'jpg';
        const key = `feedback/${feedback.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const url = await this.s3.upload(key, file.buffer, file.mimetype);
        imageUrls.push(url);
      }

      // Cập nhật imageUrls
      return this.prisma.feedback.update({
        where: { id: feedback.id },
        data: { imageUrls },
        include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
      });
    }

    return this.prisma.feedback.findUnique({
      where: { id: feedback.id },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, isAdmin: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // ── User: Xem feedback của mình ─────────────────────────────────────────
  async getMyFeedbacks(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where: { userId },
        include: {
          comments: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true, isAdmin: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedback.count({ where: { userId } }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ── Admin: Lấy tất cả feedback ─────────────────────────────────────────
  async getAllFeedbacks(
    page = 1,
    limit = 20,
    type?: string,
    status?: string,
  ) {
    const where: Record<string, unknown> = {};
    if (type && type !== 'all') where.type = type;
    if (status && status !== 'all') where.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.feedback.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatarUrl: true } },
          comments: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true, isAdmin: true } },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.feedback.count({ where }),
    ]);

    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ── Admin: Thống kê tổng hợp ───────────────────────────────────────────
  async getFeedbackStats() {
    const [total, byType, byStatus] = await Promise.all([
      this.prisma.feedback.count(),
      this.prisma.feedback.groupBy({ by: ['type'], _count: { _all: true } }),
      this.prisma.feedback.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

    const typeMap: Record<string, number> = {};
    for (const t of byType) typeMap[t.type] = t._count._all;

    const statusMap: Record<string, number> = {};
    for (const s of byStatus) statusMap[s.status] = s._count._all;

    return { total, byType: typeMap, byStatus: statusMap };
  }

  // ── Admin: Cập nhật status / admin note ─────────────────────────────────
  async updateFeedback(id: string, data: { status?: FeedbackStatus; adminNote?: string }) {
    const existing = await this.prisma.feedback.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Feedback không tồn tại');

    return this.prisma.feedback.update({
      where: { id },
      data,
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } },
        comments: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true, isAdmin: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // ── Admin: Xóa feedback + ảnh S3 ───────────────────────────────────────
  async deleteFeedback(id: string) {
    const existing = await this.prisma.feedback.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Feedback không tồn tại');

    // Xóa ảnh trên S3
    for (const url of existing.imageUrls) {
      const key = this.s3.extractKey(url);
      if (key) {
        await this.s3.delete(key).catch((err) => {
          this.logger.warn(`Không thể xóa ảnh S3 "${key}": ${err}`);
        });
      }
    }

    await this.prisma.feedback.delete({ where: { id } });
    return { success: true };
  }

  // ── User/Admin: Phản hồi feedback ───────────────────────────────────────
  async addComment(
    userId: string,
    feedbackId: string,
    message: string,
    isAdmin = false,
  ) {
    const feedback = await this.prisma.feedback.findUnique({
      where: { id: feedbackId },
    });
    if (!feedback) {
      throw new NotFoundException('Feedback không tồn tại');
    }

    if (!isAdmin && feedback.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền phản hồi feedback này');
    }

    const comment = await this.prisma.feedbackComment.create({
      data: {
        feedbackId,
        userId,
        message,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
            isAdmin: true,
          },
        },
      },
    });

    if (isAdmin && feedback.status === FeedbackStatus.PENDING) {
      await this.prisma.feedback.update({
        where: { id: feedbackId },
        data: { status: FeedbackStatus.REVIEWED },
      });
    }

    return comment;
  }
}
