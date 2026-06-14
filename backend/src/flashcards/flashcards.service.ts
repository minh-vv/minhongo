import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import AdmZip from 'adm-zip';
import initSqlJs from 'sql.js';
import * as fzstd from 'fzstd';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateDeckDto,
  UpdateDeckDto,
  CreateCardDto,
  UpdateCardDto,
  ReviewQuality,
  DeckCategory,
} from './dto';

@Injectable()
export class FlashcardsService {
  constructor(private prisma: PrismaService) {}

  // ========== DECK CRUD ==========

  async getDecks(userId: string) {
    return this.prisma.deck.findMany({
      where: { userId },
      include: {
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPublicDecks() {
    return this.prisma.deck.findMany({
      where: { isPublic: true },
      include: {
        user: {
          select: { id: true, name: true },
        },
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Lấy chi tiết một deck công khai kèm thẻ — không yêu cầu đăng nhập */
  async getPublicDeckById(id: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id, isPublic: true },
      include: {
        cards: { orderBy: { createdAt: 'asc' } },
        user: { select: { id: true, name: true } },
        _count: { select: { cards: true } },
      },
    });

    if (!deck) throw new NotFoundException('Deck công khai không tồn tại');
    return deck;
  }

  async getDeckById(id: string, userId: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id },
      include: {
        cards: {
          orderBy: { createdAt: 'asc' },
          include: {
            progress: {
              where: { userId },
            },
          },
        },
        lessonDecks: {
          include: {
            lesson: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Deck không tồn tại');
    }

    if (!deck.isPublic && deck.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập deck này');
    }

    return deck;
  }

  async createDeck(userId: string, dto: CreateDeckDto) {
    return this.prisma.deck.create({
      data: {
        name: dto.name,
        description: dto.description,
        isPublic: dto.isPublic ?? false,
        category: dto.category ?? DeckCategory.TUHOC,
        jlptLevel: dto.jlptLevel,
        userId,
      },
    });
  }

  async updateDeck(
    id: string,
    userId: string,
    dto: UpdateDeckDto,
    isAdmin = false,
  ) {
    const deck = await this.prisma.deck.findUnique({ where: { id } });

    if (!deck) {
      throw new NotFoundException('Deck không tồn tại');
    }

    this.assertCanModifyDeck(deck, userId, isAdmin);

    return this.prisma.deck.update({
      where: { id },
      data: dto,
    });
  }

  async deleteDeck(id: string, userId: string, isAdmin = false) {
    const deck = await this.prisma.deck.findUnique({ where: { id } });

    if (!deck) {
      throw new NotFoundException('Deck không tồn tại');
    }

    this.assertCanModifyDeck(deck, userId, isAdmin);

    return this.prisma.deck.delete({ where: { id } });
  }

  // ========== CARD CRUD ==========

  async createCard(
    deckId: string,
    userId: string,
    dto: CreateCardDto,
    isAdmin = false,
  ) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });

    if (!deck) {
      throw new NotFoundException('Deck không tồn tại');
    }

    this.assertCanModifyDeck(deck, userId, isAdmin);

    return this.prisma.card.create({
      data: {
        ...dto,
        deckId,
      },
    });
  }

  async createCardsBulk(
    deckId: string,
    userId: string,
    cardsDto: any[],
    isAdmin = false,
  ) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });

    if (!deck) {
      throw new NotFoundException('Deck không tồn tại');
    }

    this.assertCanModifyDeck(deck, userId, isAdmin);

    if (!cardsDto || cardsDto.length === 0) {
      throw new BadRequestException('Danh sách thẻ học không được để trống');
    }

    const validCards = cardsDto
      .filter((c) => c.front?.trim() && c.back?.trim())
      .map((c) => ({
        front: c.front.trim(),
        back: c.back.trim(),
        romaji: c.romaji?.trim() || null,
        example: c.example?.trim() || null,
        jlptLevel: c.jlptLevel ?? null,
        deckId,
      }));

    if (validCards.length === 0) {
      throw new BadRequestException('Không tìm thấy thẻ học hợp lệ nào để thêm');
    }

    await this.prisma.card.createMany({
      data: validCards,
    });

    return {
      success: true,
      count: validCards.length,
      message: `Đã thêm thành công ${validCards.length} thẻ mới.`,
    };
  }

  async updateCard(
    id: string,
    userId: string,
    dto: UpdateCardDto,
    isAdmin = false,
  ) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: { deck: true },
    });

    if (!card) {
      throw new NotFoundException('Thẻ không tồn tại');
    }

    this.assertCanModifyDeck(card.deck, userId, isAdmin);

    return this.prisma.card.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCard(id: string, userId: string, isAdmin = false) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: { deck: true },
    });

    if (!card) {
      throw new NotFoundException('Thẻ không tồn tại');
    }

    this.assertCanModifyDeck(card.deck, userId, isAdmin);

    return this.prisma.card.delete({ where: { id } });
  }

  // ========== SRS (SPACED REPETITION) ==========

  /**
   * Lấy danh sách thẻ cần ôn tập trong một deck
   * Chỉ lấy thẻ đến hạn ôn tập (nextReviewDate <= now)
   */
  async getDueCards(deckId: string, userId: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        cards: {
          include: {
            progress: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Deck không tồn tại');
    }

    // Kiểm tra quyền truy cập
    if (!deck.isPublic && deck.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập deck này');
    }

    const now = new Date();

    // Lọc thẻ đến hạn ôn tập
    const dueCards = deck.cards
      .filter((card) => {
        const progress = card.progress[0];
        // Nếu chưa có progress hoặc đã đến hạn ôn tập
        return !progress || progress.nextReviewDate <= now;
      })
      .map((card) => ({
        ...card,
        progress: card.progress[0] || null,
      }));

    return {
      deck: {
        id: deck.id,
        name: deck.name,
        totalCards: deck.cards.length,
      },
      dueCards,
      dueCount: dueCards.length,
    };
  }

  /**
   * Lấy thống kê tiến độ học của user trong một deck
   */
  async getDeckStats(deckId: string, userId: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id: deckId },
      include: {
        cards: {
          include: {
            progress: {
              where: { userId },
            },
          },
        },
      },
    });

    if (!deck) {
      throw new NotFoundException('Deck không tồn tại');
    }

    const now = new Date();
    let newCards = 0;
    let learning = 0;
    let review = 0;
    let mastered = 0;

    for (const card of deck.cards) {
      const progress = card.progress[0];

      if (!progress) {
        newCards++;
      } else if (progress.repetitions === 0) {
        learning++;
      } else if (progress.interval < 21) {
        review++;
      } else {
        mastered++;
      }
    }

    return {
      totalCards: deck.cards.length,
      newCards,
      learning,
      review,
      mastered,
      dueToday: deck.cards.filter((card) => {
        const progress = card.progress[0];
        return !progress || progress.nextReviewDate <= now;
      }).length,
    };
  }

  /**
   * Ôn tập một thẻ với thuật toán SM-2
   *
   * SM-2 Algorithm:
   * - EF (Ease Factor): 1.3 - 2.5 (mặc định 2.5)
   * - Nếu quality < 2: reset repetitions, interval = 1
   * - Nếu quality >= 2:
   *   - repetitions = 0: interval = 1
   *   - repetitions = 1: interval = 6
   *   - repetitions >= 2: interval = interval * EF
   * - EF = EF + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02))
   * - EF tối thiểu = 1.3
   */
  async reviewCard(cardId: string, userId: string, quality: ReviewQuality) {
    const card = await this.prisma.card.findUnique({
      where: { id: cardId },
      include: {
        deck: true,
        progress: {
          where: { userId },
        },
      },
    });

    if (!card) {
      throw new NotFoundException('Thẻ không tồn tại');
    }

    // Kiểm tra quyền truy cập
    if (!card.deck.isPublic && card.deck.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền ôn tập thẻ này');
    }

    const existingProgress = card.progress[0];

    // Tính toán SM-2
    let easeFactor = existingProgress?.easeFactor ?? 2.5;
    let interval = existingProgress?.interval ?? 0;
    let repetitions = existingProgress?.repetitions ?? 0;
    let minutesToAdd = 0;

    if (quality === ReviewQuality.AGAIN) {
      repetitions = 0;
      interval = 0;
      minutesToAdd = 1;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (quality === ReviewQuality.HARD) {
      if (repetitions === 0) {
        interval = 0;
        minutesToAdd = 10;
      } else if (repetitions === 1) {
        interval = 0;
        minutesToAdd = 30;
      } else {
        interval = Math.max(1, Math.round(interval * 1.2));
      }
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      repetitions++;
    } else if (quality === ReviewQuality.GOOD) {
      if (repetitions === 0) {
        interval = 0;
        minutesToAdd = 30;
      } else if (repetitions === 1) {
        interval = 1;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor));
      }
      repetitions++;
    } else if (quality === ReviewQuality.EASY) {
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 3;
      } else {
        interval = Math.max(1, Math.round(interval * easeFactor * 1.3));
      }
      easeFactor = Math.min(3.0, easeFactor + 0.15);
      repetitions++;
    }

    // Tính ngày ôn tập tiếp theo
    const nextReviewDate = new Date();
    if (interval > 0) {
      nextReviewDate.setDate(nextReviewDate.getDate() + interval);
    } else {
      nextReviewDate.setMinutes(nextReviewDate.getMinutes() + minutesToAdd);
    }

    // Cập nhật hoặc tạo progress + ghi ReviewLog song song
    const [progress] = await Promise.all([
      this.prisma.cardProgress.upsert({
        where: { userId_cardId: { userId, cardId } },
        update: {
          easeFactor,
          interval,
          repetitions,
          nextReviewDate,
          lastReviewDate: new Date(),
        },
        create: {
          userId,
          cardId,
          easeFactor,
          interval,
          repetitions,
          nextReviewDate,
          lastReviewDate: new Date(),
        },
      }),
      // Ghi log từng lần ôn tập để vẽ biểu đồ lịch sử
      this.prisma.reviewLog.create({
        data: { userId, cardId, deckId: card.deckId, quality },
      }),
    ]);

    return {
      cardId,
      quality,
      easeFactor,
      interval,
      repetitions,
      nextReviewDate: progress.nextReviewDate,
      message: this.getReviewMessage(quality, interval, minutesToAdd),
    };
  }

  /** Lịch sử ôn tập theo ngày — dùng cho biểu đồ tiến độ */
  async getStudyHistory(userId: string, days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await this.prisma.reviewLog.findMany({
      where: { userId, reviewedAt: { gte: since } },
      select: { reviewedAt: true, quality: true },
      orderBy: { reviewedAt: 'asc' },
    });

    // Group by date (yyyy-mm-dd, Vietnam UTC+7)
    const map = new Map<string, { total: number; remembered: number }>();

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().slice(0, 10);
      map.set(key, { total: 0, remembered: 0 });
    }

    for (const log of logs) {
      const key = log.reviewedAt.toISOString().slice(0, 10);
      const entry = map.get(key);
      if (entry) {
        entry.total += 1;
        if (log.quality >= 2) entry.remembered += 1;
      }
    }

    const history = Array.from(map.entries()).map(
      ([date, { total, remembered }]) => ({
        date,
        total,
        remembered,
        forgot: total - remembered,
        rate: total > 0 ? Math.round((remembered / total) * 100) : 0,
      }),
    );

    const totalReviewed = logs.length;
    const totalRemembered = logs.filter((l) => l.quality >= 2).length;

    // Tính current streak (ngày liên tiếp gần nhất có ôn), tối đa theo khoảng days truyền vào
    let streak = 0;
    const daysDesc = [...history].reverse();
    for (const day of daysDesc) {
      if (day.total > 0) streak++;
      else break;
    }

    return {
      history,
      summary: {
        totalReviewed,
        totalRemembered,
        overallRate:
          totalReviewed > 0
            ? Math.round((totalRemembered / totalReviewed) * 100)
            : 0,
        streak,
        activeDays: history.filter((d) => d.total > 0).length,
      },
    };
  }

  /** Gamification summary: XP, level, badge, streak (dựa trên review logs) */
  async getGamificationSummary(userId: string) {
    const logs = await this.prisma.reviewLog.findMany({
      where: { userId },
      select: { reviewedAt: true, quality: true },
      orderBy: { reviewedAt: 'asc' },
    });

    // XP rule: Again=2, Hard=5, Good=10, Easy=15
    const xpByQuality = [2, 5, 10, 15];
    const totalXp = logs.reduce(
      (sum, l) => sum + (xpByQuality[l.quality] ?? 0),
      0,
    );

    // Level curve: 100 XP / level (simple and predictable for MVP)
    const level = Math.max(1, Math.floor(totalXp / 100) + 1);
    const currentLevelXp = totalXp % 100;
    const nextLevelXp = 100;

    // Badge by streak
    const history30 = await this.getStudyHistory(userId, 30);
    const streak = history30.summary.streak;

    const badge =
      streak >= 30
        ? { id: 'master', label: 'Master', icon: '🏆' }
        : streak >= 14
          ? { id: 'samurai', label: 'Samurai', icon: '⚔️' }
          : streak >= 7
            ? { id: 'warrior', label: 'Warrior', icon: '🛡️' }
            : streak >= 3
              ? { id: 'apprentice', label: 'Apprentice', icon: '🥋' }
              : { id: 'rookie', label: 'Rookie', icon: '🌱' };

    const achievements = [
      {
        id: 'first_review',
        unlocked: logs.length >= 1,
        label: 'Lần ôn đầu tiên',
      },
      { id: 'streak_7', unlocked: streak >= 7, label: 'Streak 7 ngày' },
      { id: 'reviews_100', unlocked: logs.length >= 100, label: '100 lượt ôn' },
      { id: 'level_10', unlocked: level >= 10, label: 'Đạt level 10' },
    ];

    return {
      xp: totalXp,
      level,
      currentLevelXp,
      nextLevelXp,
      streak,
      badge,
      totalReviews: logs.length,
      achievements,
    };
  }

  async getLeaderboard(days = 30, limit = 20) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    // Gom nhóm theo userId và quality trực tiếp dưới Database
    const groupedLogs = await this.prisma.reviewLog.groupBy({
      by: ['userId', 'quality'],
      _count: {
        _all: true,
      },
      where: {
        reviewedAt: { gte: since },
      },
    });

    const xpByQuality = [2, 5, 10, 15];
    const byUser = new Map<string, { xp: number; reviews: number }>();

    for (const log of groupedLogs) {
      const count = log._count._all;
      const xp = (xpByQuality[log.quality] ?? 0) * count;

      const prev = byUser.get(log.userId) ?? { xp: 0, reviews: 0 };
      prev.xp += xp;
      prev.reviews += count;
      byUser.set(log.userId, prev);
    }

    const userIds = Array.from(byUser.keys());
    if (userIds.length === 0) return { days, leaderboard: [] };

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const leaderboard = userIds
      .map((id) => {
        const user = userMap.get(id);
        const stat = byUser.get(id)!;
        return {
          userId: id,
          name: user?.name || user?.email?.split('@')[0] || 'Người dùng',
          avatarUrl: user?.avatarUrl || null,
          xp: stat.xp,
          reviews: stat.reviews,
          level: Math.max(1, Math.floor(stat.xp / 100) + 1),
        };
      })
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)
      .map((row, idx) => ({ rank: idx + 1, ...row }));

    return { days, leaderboard };
  }

  /**
   * Kiểm tra quyền chỉnh sửa / xóa deck.
   * - Deck công khai hoặc thuộc nội dung hệ thống (HANTU, TUVUNG, NGUPHAP)
   *   → chỉ admin mới được phép.
   * - Deck cá nhân (private, category TUHOC) → chỉ chủ sở hữu.
   */
  private assertCanModifyDeck(
    deck: { userId: string; isPublic: boolean; category: string },
    userId: string,
    isAdmin: boolean,
  ) {
    if (isAdmin) return;

    // Deck cá nhân — chỉ owner
    if (deck.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thao tác deck này');
    }

    const isSystemCategory = ['HANTU', 'TUVUNG', 'NGUPHAP'].includes(deck.category);
    if (isSystemCategory) {
      throw new ForbiddenException(
        'Chỉ admin mới có quyền sửa/xóa nội dung hệ thống',
      );
    }
  }

  // Helper method để tạo thông báo
  private getReviewMessage(
    quality: ReviewQuality,
    interval: number,
    minutesToAdd: number,
  ): string {
    const timeStr = interval > 0 ? `${interval} ngày` : `${minutesToAdd} phút`;
    const messages = {
      [ReviewQuality.AGAIN]: `Ôn lại ngay! Thẻ sẽ xuất hiện trong 1 phút.`,
      [ReviewQuality.HARD]: `Khó nhớ! Thẻ sẽ xuất hiện lại sau ${timeStr}.`,
      [ReviewQuality.GOOD]: `Tốt! Thẻ sẽ xuất hiện lại sau ${timeStr}.`,
      [ReviewQuality.EASY]: `Dễ nhớ! Thẻ sẽ xuất hiện lại sau ${timeStr}.`,
    };
    return messages[quality];
  }

  // ========== IMPORT ANKI ==========

  /**
   * Import deck từ file Anki (.apkg)
   * .apkg là file zip chứa database SQLite
   */
  async importAnkiDeck(
    userId: string,
    fileBuffer: Buffer,
    options: {
      deckName: string;
      description?: string;
      frontField?: string;
      backField?: string;
      romajiField?: string;
      exampleField?: string;
      tagsField?: string;
      isPublic?: boolean;
      category?: string;
      jlptLevel?: number;
    },
  ) {
    const { db, fieldNames } = await this.openAnkiDatabase(fileBuffer);

    try {
      // Lấy notes
      const notesRes = db.exec('SELECT id, mid, tags, flds, sfld FROM notes');
      let notes: {
        id: number;
        mid: number;
        tags: string;
        flds: string;
        sfld: string;
      }[] = [];
      if (notesRes.length > 0) {
        notes = notesRes[0].values.map((row: any[]) => ({
          id: Number(row[0]),
          mid: Number(row[1]),
          tags: String(row[2] || ''),
          flds: String(row[3] || ''),
          sfld: String(row[4] || ''),
        }));
      }

      // Map fields theo config hoặc mặc định
      const frontField = options.frontField || fieldNames[0] || 'Front';
      const backField =
        options.backField || fieldNames[1] || fieldNames[0] || 'Back';
      const romajiField = options.romajiField;
      const exampleField = options.exampleField;

      // Tạo deck mới
      // isPublic đã được @Transform trong ImportDeckDto chuyển về boolean
      const deck = await this.prisma.deck.create({
        data: {
          name: options.deckName,
          description:
            options.description ||
            `Import từ Anki - ${new Date().toLocaleDateString()}`,
          userId,
          isPublic: options.isPublic ?? false,
          category: (options.category as any) ?? 'TUHOC',
          jlptLevel: options.jlptLevel ?? null,
        },
      });

      let importedCount = 0;
      const batchSize = 100;
      const cardBatch: any[] = [];

      for (const note of notes) {
        const fields = note.flds.split('\x1f'); // Anki dùng 0x1F làm separator
        const fieldMap: Record<string, string> = {};

        fieldNames.forEach((name: string, index: number) => {
          fieldMap[name] = fields[index] || '';
        });

        // Trích xuất thông tin
        const front = this.cleanHtml(fieldMap[frontField] || '');
        const back = this.cleanHtml(fieldMap[backField] || '');
        const romaji = romajiField
          ? this.cleanHtml(fieldMap[romajiField] || '')
          : null;
        const example = exampleField
          ? this.cleanHtml(fieldMap[exampleField] || '')
          : null;

        // Bỏ qua nếu front hoặc back trống
        if (!front || !back) continue;

        // Trích xuất JLPT level từ tags
        let jlptLevel: number | null = null;
        const tags = note.tags || '';
        const jlptMatch = tags.match(/jlpt[_-]?n(\d)/i);
        if (jlptMatch) {
          jlptLevel = parseInt(jlptMatch[1]);
        }

        cardBatch.push({
          front,
          back,
          romaji: romaji || null,
          example: example || null,
          jlptLevel,
          deckId: deck.id,
        });

        importedCount++;

        // Insert batch
        if (cardBatch.length >= batchSize) {
          await this.prisma.card.createMany({
            data: cardBatch,
            skipDuplicates: true,
          });
          cardBatch.length = 0;
        }
      }

      // Insert remaining cards
      if (cardBatch.length > 0) {
        await this.prisma.card.createMany({
          data: cardBatch,
          skipDuplicates: true,
        });
      }

      db.close();

      return {
        deckId: deck.id,
        deckName: deck.name,
        importedCount,
        availableFields: fieldNames,
      };
    } catch (error) {
      throw new Error(`Lỗi khi đọc file Anki: ${error.message}`);
    }
  }

  /**
   * Lấy danh sách trường có sẵn từ file Anki (preview)
   */
  async previewAnkiFile(fileBuffer: Buffer) {
    const { db, fieldNames } = await this.openAnkiDatabase(fileBuffer);

    try {
      // Lấy số lượng notes
      let count = 0;
      const countRes = db.exec('SELECT COUNT(*) FROM notes');
      if (countRes.length > 0) {
        count = Number(countRes[0].values[0][0]);
      }

      // Lấy 1 sample note
      let sampleFields: string[] = [];
      const sampleRes = db.exec('SELECT flds FROM notes LIMIT 1');
      if (sampleRes.length > 0) {
        const flds = String(sampleRes[0].values[0][0] || '');
        sampleFields = flds.split('\x1f');
      }

      db.close();

      return {
        fieldNames,
        totalNotes: count,
        sampleFields,
        suggestedMapping: this.suggestFieldMapping(fieldNames),
      };
    } catch (error) {
      throw new Error(`Lỗi khi đọc file Anki: ${error.message}`);
    }
  }

  /**
   * Mở file Anki (.apkg) và trả về DB instance + danh sách field names.
   * Caller chịu trách nhiệm gọi db.close() và tmpFile.removeCallback().
   */
  private async openAnkiDatabase(fileBuffer: Buffer) {
    const zip = new AdmZip(fileBuffer);

    let dbBuffer: Buffer;

    // Support modern anki21b (zstd compressed) and legacy formats
    const anki21b = zip
      .getEntries()
      .find((e) => e.entryName === 'collection.anki21b');
    const anki21 = zip
      .getEntries()
      .find((e) => e.entryName === 'collection.anki21');
    const anki2 = zip
      .getEntries()
      .find((e) => e.entryName === 'collection.anki2');

    if (anki21b) {
      const compressed = anki21b.getData();
      const decompressed = fzstd.decompress(
        new Uint8Array(compressed) as Uint8Array,
      );
      dbBuffer = Buffer.from(decompressed);
    } else if (anki21) {
      dbBuffer = anki21.getData();
    } else if (anki2) {
      dbBuffer = anki2.getData();
    } else {
      throw new NotFoundException('Không tìm thấy database trong file Anki');
    }

    const SQL = await initSqlJs();
    const db = new SQL.Database(dbBuffer);

    let fieldNames: string[] = [];

    try {
      // Check for tables
      const tablesRes = db.exec(
        "SELECT name FROM sqlite_master WHERE type='table'",
      );
      const tables =
        tablesRes.length > 0
          ? tablesRes[0].values.map((row) => row[0] as string)
          : [];

      const hasFields = tables.includes('fields');
      const hasCol = tables.includes('col');

      if (hasFields) {
        const fieldsRes = db.exec(
          'SELECT ntid, name FROM fields ORDER BY ntid, ord',
        );
        if (fieldsRes.length > 0) {
          const allFields = fieldsRes[0].values;
          // Determine the most used model
          const midsRes = db.exec(
            'SELECT mid, COUNT(*) as c FROM notes GROUP BY mid ORDER BY c DESC LIMIT 1',
          );
          let targetMid = allFields[0][0]; // default to first
          if (midsRes.length > 0) {
            targetMid = midsRes[0].values[0][0];
          }
          fieldNames = allFields
            .filter((f) => f[0] === targetMid)
            .map((f) => f[1] as string);
        }
      } else if (hasCol) {
        const colRes = db.exec('SELECT models FROM col');
        if (colRes.length > 0 && colRes[0].values.length > 0) {
          const modelsStr = colRes[0].values[0][0] as string;
          if (modelsStr) {
            const models = JSON.parse(modelsStr) as Record<string, unknown>;
            const model = Object.values(models)[0] as any;
            fieldNames = model?.flds?.map((f: any) => f.name) ?? [];
          }
        }
      }
    } catch (error) {
      console.warn('Could not extract field names from Anki DB:', error);
    }

    return { db, fieldNames };
  }

  // Helper: Suggest field mapping dựa trên tên trường
  private suggestFieldMapping(
    fieldNames: string[],
  ): Record<string, string | null> {
    const mapping: Record<string, string | null> = {
      front: null,
      back: null,
      romaji: null,
      example: null,
    };

    const frontPatterns = ['front', 'từ', 'word', 'japanese', '日本語'];
    const backPatterns = [
      'back',
      'nghĩa',
      'meaning',
      'vietnamese',
      'việt',
      '越南',
    ];
    const romajiPatterns = ['romaji', 'reading', 'đọc', 'hiragana', 'katakana'];
    const examplePatterns = ['example', 'ví dụ', 'sentence', 'câu', '用例'];

    for (const name of fieldNames) {
      const lower = name.toLowerCase();

      if (!mapping.front && frontPatterns.some((p) => lower.includes(p))) {
        mapping.front = name;
      }
      if (!mapping.back && backPatterns.some((p) => lower.includes(p))) {
        mapping.back = name;
      }
      if (!mapping.romaji && romajiPatterns.some((p) => lower.includes(p))) {
        mapping.romaji = name;
      }
      if (!mapping.example && examplePatterns.some((p) => lower.includes(p))) {
        mapping.example = name;
      }
    }

    // Fallback: dùng field đầu tiên và thứ hai
    if (!mapping.front && fieldNames.length > 0) {
      mapping.front = fieldNames[0];
    }
    if (!mapping.back && fieldNames.length > 1) {
      mapping.back = fieldNames[1];
    } else if (!mapping.back) {
      mapping.back = fieldNames[0];
    }

    return mapping;
  }

  // ========== COMMUNITY: PUBLISH & CLONE ==========

  /**
   * Toggle trạng thái công khai của một deck.
   * Chỉ chủ sở hữu mới được phép thay đổi.
   * Trả về deck sau khi cập nhật.
   */
  async publishDeck(
    deckId: string,
    userId: string,
    isPublic: boolean,
    isAdmin = false,
  ) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });

    if (!deck) {
      throw new NotFoundException('Deck không tồn tại');
    }

    // Chỉ owner hoặc admin mới được thay đổi trạng thái công khai
    if (deck.userId !== userId && !isAdmin) {
      throw new ForbiddenException(
        'Bạn không có quyền thay đổi trạng thái deck này',
      );
    }

    return this.prisma.deck.update({
      where: { id: deckId },
      data: { isPublic },
      include: {
        _count: { select: { cards: true } },
      },
    });
  }

  /**
   * Clone một deck công khai về thư viện cá nhân của user.
   * - Tạo deck mới thuộc userId
   * - Sao chép toàn bộ card (không sao chép progress)
   * - Deck clone luôn isPublic = false
   */
  async cloneDeck(deckId: string, userId: string) {
    // Lấy deck nguồn (phải là public)
    const source = await this.prisma.deck.findUnique({
      where: { id: deckId, isPublic: true },
      include: {
        cards: { orderBy: { createdAt: 'asc' } },
        user: { select: { name: true } },
      },
    });

    if (!source) {
      throw new NotFoundException('Deck công khai không tồn tại');
    }

    // Không cho clone deck của chính mình (đã có rồi)
    if (source.userId === userId) {
      throw new ForbiddenException('Đây là deck của bạn, không cần clone');
    }

    // Tạo deck mới
    const clonedDeck = await this.prisma.deck.create({
      data: {
        name: `${source.name} (bản sao)`,
        description: source.description
          ? `${source.description}\n\n[Sao chép từ: ${source.user?.name || 'Minhongo'}]`
          : `[Sao chép từ: ${source.user?.name || 'Minhongo'}]`,
        isPublic: false, // Clone luôn là private
        category: source.category,
        jlptLevel: source.jlptLevel,
        userId,
      },
    });

    // Sao chép toàn bộ card theo batch
    if (source.cards.length > 0) {
      await this.prisma.card.createMany({
        data: source.cards.map((card) => ({
          front: card.front,
          back: card.back,
          romaji: card.romaji,
          example: card.example,
          audioUrl: card.audioUrl,
          imageUrl: card.imageUrl,
          jlptLevel: card.jlptLevel,
          deckId: clonedDeck.id,
        })),
      });
    }

    return {
      deckId: clonedDeck.id,
      deckName: clonedDeck.name,
      cardCount: source.cards.length,
      message: `Đã sao chép ${source.cards.length} thẻ vào thư viện cá nhân`,
    };
  }

  // Helper: Loại bỏ HTML tags
  private cleanHtml(text: string): string {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}
