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

    // Xác định trình độ hiện tại để mở rộng phạm vi query bài học
    const currentUpper2 = dto.currentLevel.toUpperCase();
    let currentJlptLevel = 5; // mặc định bắt đầu từ N5
    const currentLevelMatch = currentUpper2.match(/N([1-5])/);
    if (currentLevelMatch) {
      currentJlptLevel = parseInt(currentLevelMatch[1], 10);
    } else if (
      currentUpper2.includes('CHƯA BIẾT') ||
      currentUpper2.includes('BẮT ĐẦU') ||
      currentUpper2.includes('BẢNG CHỮ CÁI') ||
      currentUpper2.includes('SƠ CẤP')
    ) {
      currentJlptLevel = 5;
    } else if (currentUpper2.includes('N3') || currentUpper2.includes('TRUNG CẤP')) {
      currentJlptLevel = 3;
    }

    // 1. Lấy bài học trong hệ thống: mở rộng phạm vi từ trình độ hiện tại → mục tiêu
    // VD: Học viên N5 muốn đạt N3 → lấy bài N5 + N4 + N3 (jlptLevel lte 5, gte 3)
    const queryMaxLevel = Math.max(currentJlptLevel, targetJlptLevel); // N5=5 luôn >= N3=3
    const queryMinLevel = Math.min(currentJlptLevel, targetJlptLevel);
    let availableLessons = await this.prisma.lesson.findMany({
      where: {
        course: {
          jlptLevel: { gte: queryMinLevel, lte: queryMaxLevel },
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
        decks: {
          where: { role: 'VOCAB' },
          select: {
            deck: {
              select: {
                _count: {
                  select: { cards: true }
                }
              }
            }
          }
        }
      },
      orderBy: [{ course: { jlptLevel: 'desc' } }, { order: 'asc' }],
    });

    // Nếu không có bài học nào cho phạm vi này, lấy toàn bộ bài học công khai làm fallback
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
          decks: {
            where: { role: 'VOCAB' },
            select: {
              deck: {
                select: {
                  _count: {
                    select: { cards: true }
                  }
                }
              }
            }
          }
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

    // ── Skill grouping: prioritize user-selected skills, cap to dynamically calculated size ──
    const prioritySkills: string[] =
      dto.prioritySkills && dto.prioritySkills.length > 0
        ? dto.prioritySkills
        : ['VOCABULARY', 'GRAMMAR'];

    const sourceLessons =
      notYetStudied.length > 0 ? notYetStudied : availableLessons;
    // Stable sort: ưu tiên kỹ năng chọn, nhưng giữ thứ tự sư phạm trong cùng nhóm
    const sortedSource = [...sourceLessons].sort((a, b) => {
      const aP = a.skills.some((s) => prioritySkills.includes(s as string)) ? 0 : 1;
      const bP = b.skills.some((s) => prioritySkills.includes(s as string)) ? 0 : 1;
      if (aP !== bP) return aP - bP;
      // Giữ thứ tự sư phạm: N5 trước N4 trước N3, trong cùng course theo order
      if (a.course.jlptLevel !== b.course.jlptLevel)
        return b.course.jlptLevel - a.course.jlptLevel;
      return a.order - b.order;
    });

    // Tính toán số ngày học mỗi tuần — phân biệt rõ các mốc thời gian
    const studyDaysPerWeek =
      dto.minutesPerDay >= 90 ? 6
        : dto.minutesPerDay >= 60 ? 5
        : dto.minutesPerDay >= 30 ? 5
        : dto.minutesPerDay >= 15 ? 4
        : 3;
    const totalWeeks = dto.targetMonths * 4;
    const totalStudyDays = totalWeeks * studyDaysPerWeek;

    const maxCatalogSize = Math.min(
      Math.max(Math.ceil(totalStudyDays * 1.5), 30), // Ít nhất 30, tối đa 1.5x nhu cầu
      sourceLessons.length,
      150, // Hard cap cho token budget
    );
    const capped = sortedSource.slice(0, maxCatalogSize);

    // Định nghĩa công thức tách bài học nhiều từ vựng thành nhiều phần
    const MINUTES_PER_VOCAB = 1.5; // hằng số thời gian học mỗi từ (phút)
    const vocabPerSession = Math.max(1, Math.floor(dto.minutesPerDay / MINUTES_PER_VOCAB));

    interface LessonPart {
      id: string;
      title: string;
      skills: string[];
      estimatedMin: number;
      course: { title: string; jlptLevel: number; slug: string };
      partIndex: number | null;
      partTotal: number | null;
      vocabStart: number;
      vocabEnd: number;
    }

    const lessonParts: LessonPart[] = [];
    for (const l of capped) {
      // Đếm số card của lesson (qua relation decks -> deck -> cards)
      const vocabCount = l.decks.reduce((sum, d) => sum + (d.deck?._count?.cards || 0), 0);
      const partTotal = vocabCount > 0 ? Math.ceil(vocabCount / vocabPerSession) : 1;

      if (partTotal > 1) {
        for (let i = 1; i <= partTotal; i++) {
          const vocabStart = (i - 1) * vocabPerSession + 1;
          const vocabEnd = Math.min(i * vocabPerSession, vocabCount);
          lessonParts.push({
            id: l.id,
            title: l.title,
            skills: l.skills as string[],
            estimatedMin: Math.ceil(l.estimatedMin / partTotal),
            course: l.course,
            partIndex: i,
            partTotal,
            vocabStart,
            vocabEnd,
          });
        }
      } else {
        lessonParts.push({
          id: l.id,
          title: l.title,
          skills: l.skills as string[],
          estimatedMin: l.estimatedMin,
          course: l.course,
          partIndex: null,
          partTotal: null,
          vocabStart: 1,
          vocabEnd: vocabCount,
        });
      }
    }

    const formatLessonPart = (lp: LessonPart) => {
      const partStr = lp.partTotal && lp.partTotal > 1 ? ` | PART_INDEX="${lp.partIndex}" | PART_TOTAL="${lp.partTotal}"` : '';
      const titleSuffix = lp.partTotal && lp.partTotal > 1 ? ` (Phần ${lp.partIndex}/${lp.partTotal}: Từ ${lp.vocabStart}-${lp.vocabEnd})` : '';
      return `  ID="${lp.id}"${partStr} | [N${lp.course.jlptLevel}] ${lp.course.title} › ${lp.title}${titleSuffix} | Skills:${lp.skills.join('+')} | ~${lp.estimatedMin}ph`;
    };

    const SKILL_DISPLAY: Record<string, string> = {
      VOCABULARY: '語彙・Từ vựng',
      GRAMMAR: '文法・Ngữ pháp',
      KANJI: '漢字・Hán tự',
      LISTENING: '聴解・Nghe hiểu',
      READING: '読解・Đọc hiểu',
    };
    const shownKeys = new Set<string>();
    const groupedSections: string[] = [];
    const allSkillOrder = [
      ...prioritySkills,
      ...Object.keys(SKILL_DISPLAY).filter((k) => !prioritySkills.includes(k)),
    ];
    for (const skill of allSkillOrder) {
      const parts = lessonParts.filter(
        (lp) => lp.skills.includes(skill) && !shownKeys.has(`${lp.id}_${lp.partIndex || 1}`),
      );
      if (parts.length === 0) continue;
      parts.forEach((lp) => shownKeys.add(`${lp.id}_${lp.partIndex || 1}`));
      const label = prioritySkills.includes(skill)
        ? `⭐ ${SKILL_DISPLAY[skill] || skill}`
        : SKILL_DISPLAY[skill] || skill;
      groupedSections.push(
        `[${label}] — ${parts.length} phần học:\n${parts.map(formatLessonPart).join('\n')}`,
      );
    }
    const remaining = lessonParts.filter((lp) => !shownKeys.has(`${lp.id}_${lp.partIndex || 1}`));
    if (remaining.length > 0) {
      groupedSections.push(
        `[Khác] — ${remaining.length} phần học:\n${remaining.map(formatLessonPart).join('\n')}`,
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

    // Tính minLessonsPerPhase động dựa trên coverage thực tế của catalog
    const catalogCoverage = Math.min(1, lessonParts.length / Math.max(totalStudyDays, 1));
    const minLessonsPerPhase = Math.max(
      2,
      Math.ceil(studyDaysPerWeek * Math.min(0.85, catalogCoverage)),
    );

    // Sinh tiến trình dynamic dựa trên kỹ năng ưu tiên
    const primarySkillName = prioritySkills[0] ? (skillNames[prioritySkills[0]] || prioritySkills[0]) : 'Từ vựng';
    const secondarySkillName = prioritySkills[1] ? (skillNames[prioritySkills[1]] || prioritySkills[1]) : 'Ngữ pháp';
    const earlyWeeks = Math.ceil(totalWeeks * 0.35);
    const progressionStr = `Tiến trình: Tuần 1–${earlyWeeks} → nền tảng ${primarySkillName}; Tuần ${earlyWeeks + 1}–${Math.ceil(totalWeeks * 0.7)} → đào sâu ${secondarySkillName}; Tuần ${Math.ceil(totalWeeks * 0.7) + 1}–${totalWeeks} → luyện tổng hợp + ôn tập.`;

    const prompt = `Bạn là Sensei AI — hệ thống tạo lộ trình học tiếng Nhật cá nhân hóa.

# NHIỆM VỤ
Tạo lộ trình ${dto.targetMonths} tháng (đúng ${totalWeeks} tuần) bằng cách CHỌN các phần học từ CATALOG bên dưới.
⚠️ Chỉ dùng lessonId có trong catalog. Không được tự bịa UUID. Nếu không có bài phù hợp hoặc đó là ngày ôn tập, đặt lessonId = null.

# THÔNG TIN HỌC VIÊN
- Mục tiêu: ${dto.goal}
- Trình độ JLPT mục tiêu: N${targetJlptLevel}
- Trình độ hiện tại: ${dto.currentLevel}
- Thời gian: ${dto.targetMonths} tháng (${totalWeeks} tuần) · ${dto.minutesPerDay} phút/ngày · ~${studyDaysPerWeek} ngày/tuần
- Kỹ năng ưu tiên: ${prioritySkillsLabel}
- Tổng ngày học dự kiến: ${totalStudyDays} ngày
- Tổng số phần học trong catalog: ${lessonParts.length} phần học
${achievementsContext}${testResultsContext}${alreadyStr}

# CATALOG BÀI HỌC (⭐ = kỹ năng ưu tiên của học viên)
Các bài đã sắp xếp theo thứ tự sư phạm (bài dễ/cơ bản trước, nâng cao sau). Hãy tuân thủ thứ tự này.
Mỗi bài nặng có thể được chia thành nhiều phần học khác nhau (có PART_INDEX và PART_TOTAL). Hãy chọn đầy đủ tất cả các phần của bài học đó.
${lessonListStr}

# PHÂN BỔ KỸ NĂNG & RÀNG BUỘC INTERLEAVING (HỌC XEN KẼ KỸ NĂNG)
${skillDistributionStr}
${progressionStr}

Ràng buộc xen kẽ kỹ năng (INTERLEAVING) bắt buộc:
1. MỖI TUẦN bắt buộc phải có ÍT NHẤT 2-3 kỹ năng khác nhau. TUYỆT ĐỐI KHÔNG để một tuần chỉ có đúng 1 kỹ năng học duy nhất.
2. Ưu tiên chọn các bài học trong catalog có chứa nhiều skills để trộn lẫn kỹ năng trong cùng một buổi.
3. Tuần đầu tiên: Trọng tâm chiếm khoảng 50-60% thời lượng là từ vựng nền tảng, nhưng vẫn phải xen kẽ 40-50% là ngữ pháp hoặc chữ Hán cơ bản. TUYỆT ĐỐI KHÔNG dồn 100% từ vựng vào tuần đầu tiên.

# TÍCH HỢP SPACED REPETITION (ÔN TẬP LẶP LẠI NGẮT QUÃNG)
- Để tối ưu hóa việc ghi nhớ theo phương pháp SM-2, cứ sau khoảng 4-5 buổi học bài mới, BẮT BUỘC chèn 1 buổi học ôn tập tự do.
- Cấu trúc buổi ôn tập này trong JSON:
  * "lessonId": null
  * "partIndex": null
  * "partTotal": null
  * "customTitle": "Ôn tập flashcard"
  * "customDesc": "Ôn tập flashcard các bài đã học theo lịch SM-2"

# RÀNG BUỘC BẮT BUỘC KHÁC
1. Tổng số phases = đúng ${totalWeeks} (mỗi phase = 1 tuần)
2. Mỗi phase (tuần) = đúng ${studyDaysPerWeek} items (bao gồm cả các buổi học và buổi ôn tập flashcard)
3. Ít nhất ${minLessonsPerPhase}/${studyDaysPerWeek} items/tuần phải có lessonId hợp lệ từ catalog
4. Không lặp lại cùng một lessonId trong lộ trình, TRỪ trường hợp đó là bài học bị tách thành nhiều phần (có PART_INDEX và PART_TOTAL khác nhau).
5. Ưu tiên xếp bài theo thứ tự xuất hiện trong catalog (bài có order nhỏ trước, lớn sau). Đối với bài có nhiều phần, bắt buộc phải xếp theo thứ tự phần tăng dần (Phần 1 trước, sau đó đến Phần 2, Phần 3...). Không được bỏ sót phần nào của bài học đó nếu đã xếp phần đầu tiên.
6. Quy trình mỗi item: (a) Tìm bài/phần bài phù hợp trong catalog → (b) Copy UUID nguyên văn vào lessonId, copy nguyên văn PART_INDEX vào partIndex, PART_TOTAL vào partTotal → (c) Viết customTitle phản ánh đúng bài đó

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
          "partIndex": <PART_INDEX từ catalog dạng số hoặc null>,
          "partTotal": <PART_TOTAL từ catalog dạng số hoặc null>,
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

      // Validate cấu trúc JSON output trước khi lưu
      if (
        !parsedData.title ||
        !Array.isArray(parsedData.phases) ||
        parsedData.phases.length === 0
      ) {
        this.logger.error(
          'AI trả về lộ trình thiếu title hoặc phases',
        );
        throw new BadRequestException(
          'AI trả về lộ trình không đầy đủ. Vui lòng thử lại.',
        );
      }

      for (const phase of parsedData.phases) {
        if (
          !phase.title ||
          !Array.isArray(phase.items) ||
          phase.items.length === 0
        ) {
          this.logger.warn(
            `Phase thiếu title hoặc items: ${JSON.stringify(phase).substring(0, 200)}`,
          );
          // Bổ sung title mặc định nếu thiếu
          if (!phase.title) phase.title = `Tuần ${phase.order || '?'}`;
          if (!Array.isArray(phase.items)) phase.items = [];
        }
        for (const item of phase.items) {
          // Bổ sung customTitle mặc định nếu thiếu
          if (!item.customTitle) {
            item.customTitle = `Ngày ${item.order || '?'}`;
          }
        }
      }

      // Validate và normalize lessonIds (chỉ giữ ID hợp lệ)
      const validLessonIds = new Set(availableLessons.map((l) => l.id));
      
      // Tập hợp các bài học đơn lẻ đã được dùng (không tách)
      const usedSingleLessonIds = new Set<string>();
      // Tập hợp các phần bài học đã được dùng (dạng lessonId_partIndex)
      const usedLessonParts = new Set<string>();

      for (const phase of parsedData.phases) {
        for (const item of phase.items) {
          if (item.lessonId) {
            const lid = String(item.lessonId).trim();
            
            // 1. Kiểm tra ID có hợp lệ trong database không
            if (!validLessonIds.has(lid)) {
              this.logger.warn(
                `Invalid lessonId from AI: ${item.lessonId} — setting to null`,
              );
              item.lessonId = null;
              item.partIndex = null;
              item.partTotal = null;
              continue;
            }

            const pIndex = item.partIndex ? parseInt(String(item.partIndex), 10) : null;
            const pTotal = item.partTotal ? parseInt(String(item.partTotal), 10) : null;

            if (pTotal && pTotal > 1 && pIndex && pIndex >= 1 && pIndex <= pTotal) {
              // 2. Đối với bài học được tách: cho phép trùng lessonId nhưng cấm trùng lặp phần (partIndex)
              const partKey = `${lid}_${pIndex}`;
              if (usedLessonParts.has(partKey) || usedSingleLessonIds.has(lid)) {
                this.logger.warn(
                  `Duplicate lesson part or single lesson already used: ${partKey} — setting to null`,
                );
                item.lessonId = null;
                item.partIndex = null;
                item.partTotal = null;
              } else {
                item.lessonId = lid;
                item.partIndex = pIndex;
                item.partTotal = pTotal;
                usedLessonParts.add(partKey);
              }
            } else {
              // 3. Đối với bài học bình thường (không tách)
              if (usedSingleLessonIds.has(lid) || usedLessonParts.has(`${lid}_1`) || usedLessonParts.has(`${lid}_2`)) {
                // Nếu đã dùng dưới dạng bài đơn lẻ hoặc bất kỳ phần nào trước đó
                this.logger.warn(
                  `Duplicate lessonId (single) from AI: ${lid} — setting to null`,
                );
                item.lessonId = null;
                item.partIndex = null;
                item.partTotal = null;
              } else {
                item.lessonId = lid;
                item.partIndex = null;
                item.partTotal = null;
                usedSingleLessonIds.add(lid);
              }
            }
          } else {
            // Đảm bảo null-safe cho item tự do/ôn tập
            item.lessonId = null;
            item.partIndex = null;
            item.partTotal = null;
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
                      partIndex: item.partIndex || null,
                      partTotal: item.partTotal || null,
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
