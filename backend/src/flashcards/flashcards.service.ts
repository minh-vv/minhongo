import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
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

  async getDeckById(id: string, userId: string) {
    const deck = await this.prisma.deck.findUnique({
      where: { id },
      include: {
        cards: {
          orderBy: { createdAt: 'asc' },
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

  async updateDeck(id: string, userId: string, dto: UpdateDeckDto) {
    const deck = await this.prisma.deck.findUnique({ where: { id } });

    if (!deck) {
      throw new NotFoundException('Deck không tồn tại');
    }

    if (deck.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa deck này');
    }

    return this.prisma.deck.update({
      where: { id },
      data: dto,
    });
  }

  async deleteDeck(id: string, userId: string) {
    const deck = await this.prisma.deck.findUnique({ where: { id } });

    if (!deck) {
      throw new NotFoundException('Deck không tồn tại');
    }

    if (deck.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa deck này');
    }

    return this.prisma.deck.delete({ where: { id } });
  }

  // ========== CARD CRUD ==========

  async createCard(deckId: string, userId: string, dto: CreateCardDto) {
    const deck = await this.prisma.deck.findUnique({ where: { id: deckId } });

    if (!deck) {
      throw new NotFoundException('Deck không tồn tại');
    }

    if (deck.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thêm thẻ vào deck này');
    }

    return this.prisma.card.create({
      data: {
        ...dto,
        deckId,
      },
    });
  }

  async updateCard(id: string, userId: string, dto: UpdateCardDto) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: { deck: true },
    });

    if (!card) {
      throw new NotFoundException('Thẻ không tồn tại');
    }

    if (card.deck.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền chỉnh sửa thẻ này');
    }

    return this.prisma.card.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCard(id: string, userId: string) {
    const card = await this.prisma.card.findUnique({
      where: { id },
      include: { deck: true },
    });

    if (!card) {
      throw new NotFoundException('Thẻ không tồn tại');
    }

    if (card.deck.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa thẻ này');
    }

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
    let easeFactor = existingProgress?.easeFactor || 2.5;
    let interval = existingProgress?.interval || 0;
    let repetitions = existingProgress?.repetitions || 0;

    if (quality < ReviewQuality.GOOD) {
      // Chất lượng kém (< 2): reset
      repetitions = 0;
      interval = 1;
    } else {
      // Chất lượng tốt (>= 2)
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions++;
    }

    // Cập nhật ease factor
    easeFactor =
      easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02));
    easeFactor = Math.max(1.3, easeFactor); // Tối thiểu 1.3

    // Tính ngày ôn tập tiếp theo
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + interval);

    // Cập nhật hoặc tạo progress
    const progress = await this.prisma.cardProgress.upsert({
      where: {
        userId_cardId: {
          userId,
          cardId,
        },
      },
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
    });

    return {
      cardId,
      quality,
      easeFactor,
      interval,
      repetitions,
      nextReviewDate: progress.nextReviewDate,
      message: this.getReviewMessage(quality, interval),
    };
  }

  // Helper method để tạo thông báo
  private getReviewMessage(quality: ReviewQuality, interval: number): string {
    const messages = {
      [ReviewQuality.AGAIN]: `Ôn lại ngay! Thẻ sẽ xuất hiện trong 1 phút.`,
      [ReviewQuality.HARD]: `Khó nhớ! Thẻ sẽ xuất hiện lại sau ${interval} ngày.`,
      [ReviewQuality.GOOD]: `Tốt! Thẻ sẽ xuất hiện lại sau ${interval} ngày.`,
      [ReviewQuality.EASY]: `Dễ nhớ! Thẻ sẽ xuất hiện lại sau ${interval} ngày.`,
    };
    return messages[quality];
  }

  // ========== IMPORT ANKI ==========

  /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unused-vars, @typescript-eslint/require-await, @typescript-eslint/no-unsafe-argument */

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
    },
  ) {
    // Parse APKG file (zip format)
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(fileBuffer);
    const zipEntries = zip.getEntries();

    // Tìm file .anki2 (SQLite database)
    const dbEntry = zipEntries.find((entry) =>
      entry.entryName.endsWith('.anki2'),
    );

    if (!dbEntry) {
      throw new NotFoundException('Không tìm thấy database trong file Anki');
    }

    // Đọc SQLite database từ buffer
    const dbBuffer = dbEntry.getData();

    // Tạo temporary file để đọc với SQLite
    const Database = require('better-sqlite3');
    const tmp = require('tmp');
    const tmpFile = tmp.fileSync({ suffix: '.anki2' });
    require('fs').writeFileSync(tmpFile.name, dbBuffer);

    try {
      const db = new Database(tmpFile.name, { readonly: true });

      // Lấy danh sách models (templates) để biết các trường
      const models = db.prepare('SELECT models FROM col').get();
      const modelsJson = JSON.parse(models.models);
      const model = Object.values(modelsJson)[0] as any;

      // Lấy danh sách trường có sẵn
      const availableFields = model?.flds?.map((f) => f.name) || [];

      // Lấy thông tin deck từ Anki
      const decks = db.prepare('SELECT decks FROM col').get();
      const decksJson = JSON.parse(decks.decks);

      // Lấy notes và cards
      const notes = db
        .prepare(
          `
        SELECT 
          notes.id,
          notes.mid,
          notes.tags,
          notes.flds,
          notes.sfld
        FROM notes
      `,
        )
        .all();

      // Lấy field names từ model
      const fieldNames = availableFields;

      // Map fields theo config hoặc mặc định
      const frontField = options.frontField || fieldNames[0] || 'Front';
      const backField =
        options.backField || fieldNames[1] || fieldNames[0] || 'Back';
      const romajiField = options.romajiField;
      const exampleField = options.exampleField;
      const tagsField = options.tagsField;

      // Tạo deck mới
      const deck = await this.prisma.deck.create({
        data: {
          name: options.deckName,
          description:
            options.description ||
            `Import từ Anki - ${new Date().toLocaleDateString()}`,
          userId,
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
      tmpFile.removeCallback();

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
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(fileBuffer);
    const zipEntries = zip.getEntries();

    const dbEntry = zipEntries.find((entry) =>
      entry.entryName.endsWith('.anki2'),
    );

    if (!dbEntry) {
      throw new NotFoundException('Không tìm thấy database trong file Anki');
    }

    const dbBuffer = dbEntry.getData();
    const tmp = require('tmp');
    const tmpFile = tmp.fileSync({ suffix: '.anki2' });
    require('fs').writeFileSync(tmpFile.name, dbBuffer);

    try {
      const Database = require('better-sqlite3');
      const db = new Database(tmpFile.name, { readonly: true });

      // Lấy model để biết các trường
      const models = db.prepare('SELECT models FROM col').get();
      const modelsJson = JSON.parse(models.models);
      const model = Object.values(modelsJson)[0] as any;
      const fieldNames = model?.flds?.map((f) => f.name) || [];

      // Lấy số lượng notes
      const countResult = db
        .prepare('SELECT COUNT(*) as count FROM notes')
        .get();
      const count = countResult?.count || 0;

      // Lấy 1 sample note
      const sampleNote = db
        .prepare('SELECT notes.flds FROM notes LIMIT 1')
        .get();
      let sampleFields: string[] = [];
      if (sampleNote) {
        sampleFields = sampleNote.flds.split('\x1f');
      }

      db.close();
      tmpFile.removeCallback();

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

  /* eslint-enable @typescript-eslint/no-require-imports */

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
