import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import { withRetry } from '../common/utils/gemini-retry';

interface TestResult {
  lessonTitle: string;
  score: number;
  date?: string;
}

interface GenerateRoadmapDto {
  goal: string;
  targetMonths: number;
  minutesPerDay: number;
  currentLevel: string;
  targetJlpt?: number;       // explicit JLPT target 1–5 (overrides regex parsing)
  prioritySkills?: string[]; // ['VOCABULARY','GRAMMAR','KANJI','LISTENING','READING']
  achievements?: string;
  testResults?: TestResult[];
}

@Injectable()
export class AiRoadmapService {
  private readonly logger = new Logger(AiRoadmapService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy');
  }

  async generateRoadmap(userId: string, dto: GenerateRoadmapDto) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy') {
      throw new BadRequestException(
        'Chưa cấu hình GEMINI_API_KEY trong file .env',
      );
    }

    // Use explicit targetJlpt if provided (most reliable — avoids regex guessing)
    let targetJlptLevel: number | null = dto.targetJlpt || null;

    if (!targetJlptLevel) {
      // Fallback: parse from free-text goal / currentLevel
      const goalUpper = dto.goal.toUpperCase();
      const currentUpper = dto.currentLevel.toUpperCase();

      const goalMatch = goalUpper.match(/N([1-5])/);
      if (goalMatch) {
        targetJlptLevel = parseInt(goalMatch[1], 10);
      } else {
        const currentMatch = currentUpper.match(/N([1-5])/);
        if (currentMatch) {
          const level = parseInt(currentMatch[1], 10);
          if (
            currentUpper.includes('ĐANG HỌC') ||
            currentUpper.includes('LEARNING')
          ) {
            targetJlptLevel = level;
          } else {
            targetJlptLevel = Math.max(1, level - 1);
          }
        }
      }

      if (!targetJlptLevel) {
        if (
          currentUpper.includes('CHƯA BIẾT') ||
          currentUpper.includes('BẮT ĐẦU') ||
          currentUpper.includes('BẢNG CHỮ CÁI') ||
          currentUpper.includes('SƠ CẤP')
        ) {
          targetJlptLevel = 5;
        } else {
          targetJlptLevel = 3;
        }
      }
    }

    // 1. Lấy bài học trong hệ thống, lọc theo trình độ mục tiêu
    let availableLessons = await this.prisma.lesson.findMany({
      where: {
        course: {
          jlptLevel: targetJlptLevel,
          isPublic: true,
        },
      },
      select: {
        id: true,
        title: true,
        skills: true,
        estimatedMin: true,
        summary: true,
        order: true,
        course: { select: { title: true, jlptLevel: true, slug: true } },
      },
      orderBy: [{ course: { jlptLevel: 'desc' } }, { order: 'asc' }],
    });

    // Nếu không có bài học nào cho trình độ mục tiêu này, lấy toàn bộ bài học công khai làm fallback
    if (availableLessons.length === 0) {
      availableLessons = await this.prisma.lesson.findMany({
        where: {
          course: {
            isPublic: true,
          },
        },
        select: {
          id: true,
          title: true,
          skills: true,
          estimatedMin: true,
          summary: true,
          order: true,
          course: { select: { title: true, jlptLevel: true, slug: true } },
        },
        orderBy: [{ course: { jlptLevel: 'desc' } }, { order: 'asc' }],
      });
    }

    // 2. Lấy tiến độ học của user (bài đã hoàn thành)
    const userProgress = await this.prisma.userLessonProgress.findMany({
      where: { userId },
      include: {
        lesson: {
          select: {
            title: true,
            skills: true,
            course: { select: { title: true, jlptLevel: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    const passedLessonIds = new Set(
      userProgress.filter((p) => p.status === 'PASSED').map((p) => p.lessonId),
    );

    // 3. Lọc và format danh sách bài học chưa học
    const notYetStudied = availableLessons.filter(
      (l) => !passedLessonIds.has(l.id),
    );
    const alreadyStudied = availableLessons.filter((l) =>
      passedLessonIds.has(l.id),
    );

    const formatLesson = (l: (typeof availableLessons)[0]) =>
      `  ID="${l.id}" | [N${l.course.jlptLevel}] ${l.course.title} › ${l.title} | Skills:${l.skills.join('+')} | ~${l.estimatedMin}ph`;

    // ── Skill grouping: prioritize user-selected skills, cap to 90 lessons ──
    const prioritySkills: string[] =
      dto.prioritySkills && dto.prioritySkills.length > 0
        ? dto.prioritySkills
        : ['VOCABULARY', 'GRAMMAR'];

    const sourceLessons =
      notYetStudied.length > 0 ? notYetStudied : availableLessons;
    const sortedSource = [...sourceLessons].sort((a, b) => {
      const aP = a.skills.some((s) => prioritySkills.includes(s as string)) ? 0 : 1;
      const bP = b.skills.some((s) => prioritySkills.includes(s as string)) ? 0 : 1;
      return aP - bP;
    });
    const capped = sortedSource.slice(0, 90);

    const SKILL_DISPLAY: Record<string, string> = {
      VOCABULARY: '語彙・Từ vựng',
      GRAMMAR: '文法・Ngữ pháp',
      KANJI: '漢字・Hán tự',
      LISTENING: '聴解・Nghe hiểu',
      READING: '読解・Đọc hiểu',
    };
    const shownIds = new Set<string>();
    const groupedSections: string[] = [];
    const allSkillOrder = [
      ...prioritySkills,
      ...Object.keys(SKILL_DISPLAY).filter((k) => !prioritySkills.includes(k)),
    ];
    for (const skill of allSkillOrder) {
      const lessons = capped.filter(
        (l) => (l.skills as string[]).includes(skill) && !shownIds.has(l.id),
      );
      if (lessons.length === 0) continue;
      lessons.forEach((l) => shownIds.add(l.id));
      const label = prioritySkills.includes(skill)
        ? `⭐ ${SKILL_DISPLAY[skill] || skill}`
        : SKILL_DISPLAY[skill] || skill;
      groupedSections.push(
        `[${label}] — ${lessons.length} bài:\n${lessons.map(formatLesson).join('\n')}`,
      );
    }
    const remaining = capped.filter((l) => !shownIds.has(l.id));
    if (remaining.length > 0) {
      groupedSections.push(
        `[Khác] — ${remaining.length} bài:\n${remaining.map(formatLesson).join('\n')}`,
      );
    }
    const lessonListStr = groupedSections.join('\n\n');

    const alreadyStr =
      alreadyStudied.length > 0
        ? `\nBÀI ĐÃ HỌC (không lặp lại):\n` +
          alreadyStudied
            .slice(0, 20)
            .map((l) => `  - [N${l.course.jlptLevel}] ${l.title}`)
            .join('\n')
        : '';

    // 4. Context thành tích + kết quả kiểm tra
    const achievementsContext = dto.achievements
      ? `\nTHÀNH TÍCH HỌC VIÊN:\n${dto.achievements}`
      : '';

    const testResultsContext =
      dto.testResults && dto.testResults.length > 0
        ? `\nKẾT QUẢ KIỂM TRA:\n` +
          dto.testResults
            .map(
              (t) =>
                `  - ${t.lessonTitle}: ${t.score}%${t.date ? ` (${t.date})` : ''}`,
            )
            .join('\n')
        : '';

    // 5. Skill distribution guidance for prompt
    const skillNames: Record<string, string> = {
      VOCABULARY: 'Từ vựng', GRAMMAR: 'Ngữ pháp',
      KANJI: 'Hán tự', LISTENING: 'Nghe hiểu', READING: 'Đọc hiểu',
    };
    const prioritySkillsLabel = prioritySkills
      .map((s) => skillNames[s] || s)
      .join(' + ');
    const pctPerSkill = Math.floor(70 / prioritySkills.length);
    const otherPct = 100 - pctPerSkill * prioritySkills.length;
    const skillDistributionStr =
      prioritySkills
        .map((s) => `${skillNames[s] || s} (${pctPerSkill}%)`)
        .join(', ') +
      (otherPct > 0 ? `; Kỹ năng khác (${otherPct}%)` : '');

    // Tính toán số ngày học mỗi tuần
    const studyDaysPerWeek =
      dto.minutesPerDay >= 60 ? 5 : dto.minutesPerDay >= 30 ? 5 : 4;
    const totalStudyDays = dto.targetMonths * 4 * studyDaysPerWeek;
    const minLessonsPerPhase = Math.ceil(studyDaysPerWeek * 0.65);

    const prompt = `Bạn là Sensei AI — hệ thống tạo lộ trình học tiếng Nhật cá nhân hóa.

# NHIỆM VỤ
Tạo lộ trình ${dto.targetMonths} tháng bằng cách CHỌN bài học từ CATALOG bên dưới.
⚠️ Chỉ dùng lessonId có trong catalog. Không được tự bịa UUID. Nếu không có bài phù hợp, đặt lessonId = null.

# THÔNG TIN HỌC VIÊN
- Mục tiêu: ${dto.goal}
- Trình độ JLPT mục tiêu: N${targetJlptLevel}
- Trình độ hiện tại: ${dto.currentLevel}
- Thời gian: ${dto.targetMonths} tháng (${dto.targetMonths * 4} tuần) · ${dto.minutesPerDay} phút/ngày · ~${studyDaysPerWeek} ngày/tuần
- Kỹ năng ưu tiên: ${prioritySkillsLabel}
- Tổng ngày học dự kiến: ${totalStudyDays} ngày
${achievementsContext}${testResultsContext}${alreadyStr}

# CATALOG BÀI HỌC (⭐ = kỹ năng ưu tiên của học viên)
${lessonListStr}

# PHÂN BỔ KỸ NĂNG
${skillDistributionStr}
Tiến trình: Tuần 1–${Math.ceil(dto.targetMonths * 4 * 0.35)} → nền tảng từ vựng; Tuần giữa → đào sâu ngữ pháp; Tuần cuối → luyện tổng hợp.

# RÀNG BUỘC BẮT BUỘC
1. Mỗi phase (tuần) = đúng ${studyDaysPerWeek} items
2. Ít nhất ${minLessonsPerPhase}/${studyDaysPerWeek} items/tuần phải có lessonId hợp lệ từ catalog
3. Không lặp lại lessonId trong toàn lộ trình
4. Quy trình mỗi item: (a) Tìm bài phù hợp trong catalog → (b) Copy UUID nguyên văn vào lessonId → (c) Viết customTitle phản ánh đúng bài đó

# JSON OUTPUT
{
  "title": "Lộ trình JLPT N${targetJlptLevel}: [tên phản ánh mục tiêu cụ thể]",
  "description": "[2 câu: học viên bắt đầu từ đâu và đạt gì sau ${dto.targetMonths} tháng]",
  "phases": [
    {
      "order": 1,
      "title": "Tuần 1: [chủ đề kỹ năng tập trung]",
      "description": "[mục tiêu kỹ năng tuần này, 1 câu]",
      "items": [
        {
          "order": 1,
          "lessonId": "<UUID nguyên văn từ catalog hoặc null>",
          "customTitle": "Ngày 1: [tên ngắn phản ánh nội dung bài]",
          "customDesc": "[lý do học bài này hôm nay, 1 câu ngắn]"
        }
      ]
    }
  ]
}`;

    try {
      let result;
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-3.1-flash-lite',
          generationConfig: { responseMimeType: 'application/json' },
        });
        result = await withRetry(() => model.generateContent(prompt), {
          logger: this.logger,
        });
      } catch (primaryError: any) {
        this.logger.warn(
          `Primary model gemini-3.1-flash-lite failed: ${primaryError.message}. Falling back to gemini-2.5-flash-lite...`,
        );
        const fallbackModel = this.genAI.getGenerativeModel({
          model: 'gemini-2.5-flash-lite',
          generationConfig: { responseMimeType: 'application/json' },
        });
        result = await withRetry(() => fallbackModel.generateContent(prompt), {
          logger: this.logger,
        });
      }
      let responseText = result.response.text() as string;

      responseText = responseText
        .replace(/^```json\n?/, '')
        .replace(/^```\n?/, '')
        .replace(/\n?```$/, '')
        .trim();

      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Lỗi parse JSON từ LLM:', responseText.substring(0, 800));
        throw new BadRequestException(
          'AI trả về dữ liệu không hợp lệ. Vui lòng thử lại.',
        );
      }

      // Validate và normalize lessonIds (chỉ giữ ID hợp lệ)
      const validLessonIds = new Set(availableLessons.map((l) => l.id));
      for (const phase of parsedData.phases || []) {
        for (const item of phase.items || []) {
          if (item.lessonId && !validLessonIds.has(item.lessonId as string)) {
            console.warn(
              `Invalid lessonId from AI: ${item.lessonId} — setting to null`,
            );
            item.lessonId = null;
          }
        }
      }

      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + dto.targetMonths);

      const roadmap = await this.prisma.customRoadmap.create({
        data: {
          userId,
          title: parsedData.title,
          description: parsedData.description,
          goal: dto.goal,
          targetDate,
          phases: {
            create: (parsedData.phases || []).map(
              (phase: any, index: number) => ({
                order: phase.order || index + 1,
                title: phase.title,
                description: phase.description,
                items: {
                  create: (phase.items || []).map(
                    (item: any, iIndex: number) => ({
                      order: item.order || iIndex + 1,
                      customTitle: item.customTitle,
                      customDesc: item.customDesc,
                      lessonId: item.lessonId || null,
                    }),
                  ),
                },
              }),
            ),
          },
        },
        include: {
          phases: {
            include: {
              items: {
                include: {
                  lesson: {
                    select: {
                      id: true,
                      title: true,
                      skills: true,
                      estimatedMin: true,
                      summary: true,
                      course: {
                        select: { title: true, jlptLevel: true, slug: true },
                      },
                      decks: {
                        select: {
                          deckId: true,
                          role: true,
                        },
                      },
                    },
                  },
                },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
      });

      return {
        ...roadmap,
        phases: roadmap.phases.map((p) => ({
          ...p,
          items: p.items.map((i) => ({
            ...i,
            isCompleted:
              i.isCompleted ||
              (i.lessonId ? passedLessonIds.has(i.lessonId) : false),
          })),
        })),
      };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new BadRequestException(
        'Không thể sinh lộ trình lúc này. Lỗi: ' + error.message,
      );
    }
  }

  async getMyRoadmaps(userId: string) {
    const roadmaps = await this.prisma.customRoadmap.findMany({
      where: { userId },
      include: {
        phases: {
          include: {
            items: { orderBy: { order: 'asc' } },
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const userProgress = await this.prisma.userLessonProgress.findMany({
      where: { userId, status: 'PASSED' },
      select: { lessonId: true },
    });
    const passedLessonIds = new Set(userProgress.map((p) => p.lessonId));

    return roadmaps.map((r) => ({
      ...r,
      phases: r.phases.map((p) => ({
        ...p,
        items: p.items.map((i) => ({
          ...i,
          isCompleted:
            i.isCompleted ||
            (i.lessonId ? passedLessonIds.has(i.lessonId) : false),
        })),
      })),
    }));
  }

  async getRoadmapById(userId: string, id: string) {
    const roadmap = await this.prisma.customRoadmap.findUnique({
      where: { id },
      include: {
        phases: {
          include: {
            items: {
              include: {
                lesson: {
                  select: {
                    id: true,
                    title: true,
                    skills: true,
                    estimatedMin: true,
                    summary: true,
                    course: {
                      select: { title: true, jlptLevel: true, slug: true },
                    },
                    decks: {
                      select: {
                        deckId: true,
                        role: true,
                      },
                    },
                  },
                },
              },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!roadmap || roadmap.userId !== userId) {
      throw new BadRequestException(
        'Lộ trình không tồn tại hoặc không có quyền truy cập',
      );
    }

    const userProgress = await this.prisma.userLessonProgress.findMany({
      where: { userId, status: 'PASSED' },
      select: { lessonId: true },
    });
    const passedLessonIds = new Set(userProgress.map((p) => p.lessonId));

    return {
      ...roadmap,
      phases: roadmap.phases.map((p) => ({
        ...p,
        items: p.items.map((i) => ({
          ...i,
          isCompleted:
            i.isCompleted ||
            (i.lessonId ? passedLessonIds.has(i.lessonId) : false),
        })),
      })),
    };
  }

  async completeItem(userId: string, itemId: string) {
    const item = await this.prisma.customRoadmapItem.findUnique({
      where: { id: itemId },
      include: {
        phase: {
          include: { roadmap: { select: { userId: true } } },
        },
      },
    });

    if (!item || item.phase.roadmap.userId !== userId) {
      throw new NotFoundException(
        'Không tìm thấy item hoặc không có quyền truy cập',
      );
    }

    return this.prisma.customRoadmapItem.update({
      where: { id: itemId },
      data: {
        isCompleted: !item.isCompleted,
        completedAt: !item.isCompleted ? new Date() : null,
      },
    });
  }

  async deleteRoadmap(userId: string, id: string) {
    const roadmap = await this.prisma.customRoadmap.findUnique({
      where: { id },
    });
    if (!roadmap || roadmap.userId !== userId) {
      throw new BadRequestException(
        'Lộ trình không tồn tại hoặc không có quyền',
      );
    }
    return this.prisma.customRoadmap.delete({ where: { id } });
  }
}
