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

    // 1. Lấy TẤT CẢ bài học trong hệ thống, có đầy đủ thông tin
    const availableLessons = await this.prisma.lesson.findMany({
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
      `  - ID="${l.id}" | [N${l.course.jlptLevel}] ${l.course.title} › ${l.title} | Kỹ năng: ${l.skills.join(',')} | ~${l.estimatedMin}ph`;

    const lessonListStr =
      notYetStudied.length > 0
        ? notYetStudied.map(formatLesson).join('\n')
        : availableLessons.map(formatLesson).join('\n');

    const alreadyStr =
      alreadyStudied.length > 0
        ? `\nBÀI HỌC ĐÃ HOÀN THÀNH (bỏ qua hoặc chỉ ôn nhanh):\n` +
          alreadyStudied
            .map((l) => `  - [N${l.course.jlptLevel}] ${l.title}`)
            .join('\n')
        : '';

    // 4. Context thành tích + kết quả kiểm tra
    const achievementsContext = dto.achievements
      ? `\nTHÀNH TÍCH CÁ NHÂN:\n${dto.achievements}`
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

    // Model will be instantiated dynamically below to support model fallback

    // Tính toán số ngày học mỗi tuần (5–6 ngày/tuần tùy phút học)
    const studyDaysPerWeek =
      dto.minutesPerDay >= 60 ? 5 : dto.minutesPerDay >= 30 ? 5 : 4;
    const totalStudyDays = dto.targetMonths * 4 * studyDaysPerWeek;

    const prompt = `Bạn là Sensei AI — chuyên gia thiết kế lộ trình học tiếng Nhật cá nhân hóa dựa trên dữ liệu thực tế.

## THÔNG TIN HỌC VIÊN
- Mục tiêu: ${dto.goal}
- Thời gian: ${dto.targetMonths} tháng (${dto.targetMonths * 4} tuần)
- Học mỗi ngày: ${dto.minutesPerDay} phút/ngày (~${studyDaysPerWeek} ngày/tuần)
- Trình độ hiện tại: ${dto.currentLevel}
- Tổng số ngày học dự kiến: ${totalStudyDays} ngày
${achievementsContext}${testResultsContext}${alreadyStr}

## BÀI HỌC CÓ SẴN TRONG HỆ THỐNG (CHƯA HỌC)
${lessonListStr}

## NHIỆM VỤ
Tạo lộ trình học THEO NGÀY dựa trên các bài học có sẵn ở trên.

### NGUYÊN TẮC BẮT BUỘC:
1. **MỖI ITEM = MỘT NGÀY HỌC** — label: "Ngày X: [tên ngắn gọn bài học]"
2. **lessonId PHẢI là ID chính xác** từ danh sách trên (copy nguyên văn UUID). Không được tự bịa ID.
3. **ƯU TIÊN gán lessonId**: Mỗi ngày học nên là một bài học thực tế từ hệ thống. Chỉ để lessonId=null khi ngày đó là ôn tập tổng hợp hoặc nghỉ ngơi.
4. Sắp xếp bài học từ DỄ đến KHÓ, phù hợp với trình độ học viên
5. Không lặp lại cùng một lessonId trong một lộ trình
6. Số items mỗi phase = ${studyDaysPerWeek} ngày (hoặc ít hơn nếu hết bài)
7. Tổng số phases = ${dto.targetMonths * 4} tuần

### VÍ DỤ ITEM (theo đúng format):
{
  "order": 1,
  "customTitle": "Ngày 1: Giới thiệu bản thân - はじめまして",
  "customDesc": "Học cách tự giới thiệu trong tiếng Nhật, các mẫu câu cơ bản nhất.",
  "lessonId": "UUID-CHÍNH-XÁC-TỪ-DANH-SÁCH"
}

Trả về JSON theo đúng cấu trúc sau:
{
  "title": "Lộ trình: [Tên phản ánh mục tiêu của học viên]",
  "description": "[Mô tả 2 câu: xuất phát từ đâu, đến đâu]",
  "phases": [
    {
      "order": 1,
      "title": "Tuần 1: [Chủ đề tuần]",
      "description": "[Mục tiêu tuần, 1 câu]",
      "items": [
        {
          "order": 1,
          "customTitle": "Ngày 1: [Tên bài/topic ngắn]",
          "customDesc": "[Mô tả 1-2 câu tại sao học bài này hôm nay]",
          "lessonId": "[UUID chính xác hoặc null]"
        }
      ]
    }
  ]
}`;

    try {
      let result;
      try {
        const model = this.genAI.getGenerativeModel({
          model: 'gemini-2.5-flash',
          generationConfig: { responseMimeType: 'application/json' },
        });
        result = await withRetry(() => model.generateContent(prompt), {
          logger: this.logger,
        });
      } catch (primaryError: any) {
        this.logger.warn(
          `Primary model gemini-2.5-flash failed: ${primaryError.message}. Falling back to gemini-1.5-flash...`,
        );
        const fallbackModel = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
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

      return roadmap;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      console.error(error);
      throw new BadRequestException(
        'Không thể sinh lộ trình lúc này. Lỗi: ' + error.message,
      );
    }
  }

  async getMyRoadmaps(userId: string) {
    return this.prisma.customRoadmap.findMany({
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

    return roadmap;
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
