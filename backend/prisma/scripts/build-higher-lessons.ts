/**
 * Script tạo khóa học, bài học (Lessons 1-N), decks và bài test cho N4, N3, N2, N1.
 * Lấy từ vựng đã Việt hóa từ các Deck Jisho tổng và chia đều vào từng bài học.
 *
 * Chạy: npm run build:higher-lessons [4|3|2|1|all]
 * Ví dụ: npm run build:higher-lessons 4 (chỉ tạo lộ trình N4)
 *
 * Yêu cầu: DB đang chạy + đã seed + đã crawl Jisho
 */

import { PrismaClient, LessonDeckRole, SkillType } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ============================================================
// CẤU HÌNH LỘ TRÌNH CHO CÁC CẤP ĐỘ
// ============================================================

interface CourseConfig {
  slug: string;
  title: string;
  description: string;
  textbookRef: string;
  jlptLevel: number;
  totalLessons: number;
  prefix: string; // ví dụ "Bài học" hoặc "Bài"
}

const COURSE_CONFIGS: Record<string, CourseConfig> = {
  '4': {
    slug: 'minna-n4',
    title: 'Minna no Nihongo II — JLPT N4',
    description: 'Lộ trình học từ vựng và lý thuyết cấp độ JLPT N4 theo giáo trình Minna no Nihongo II (Bài 26 → 50).',
    textbookRef: 'Minna no Nihongo II',
    jlptLevel: 4,
    totalLessons: 25, // 25 bài tương ứng bài 26 -> 50 của Minna
    prefix: 'Bài',
  },
  '3': {
    slug: 'jlpt-n3',
    title: 'JLPT N3 — Lộ trình học tổng hợp',
    description: 'Lộ trình từ vựng và ngữ pháp tổng hợp chuẩn JLPT N3 biên soạn theo giáo trình Soumatome & Shinkanzen Master N3.',
    textbookRef: 'Soumatome & Shinkanzen N3',
    jlptLevel: 3,
    totalLessons: 50, // 50 bài học toàn diện
    prefix: 'Bài học',
  },
  '2': {
    slug: 'jlpt-n2',
    title: 'JLPT N2 — Lộ trình học tổng hợp',
    description: 'Lộ trình từ vựng và ngữ pháp nâng cao cấp độ JLPT N2 biên soạn theo giáo trình Soumatome & Shinkanzen Master N2.',
    textbookRef: 'Soumatome & Shinkanzen N2',
    jlptLevel: 2,
    totalLessons: 50, // 50 bài học toàn diện
    prefix: 'Bài học',
  },
  '1': {
    slug: 'jlpt-n1',
    title: 'JLPT N1 — Lộ trình học tổng hợp',
    description: 'Lộ trình từ vựng và lý thuyết cao cấp nhất cấp độ JLPT N1 biên soạn theo giáo trình Soumatome & Shinkanzen Master N1.',
    textbookRef: 'Soumatome & Shinkanzen N1',
    jlptLevel: 1,
    totalLessons: 80, // 80 bài học để chia nhỏ 3,439 từ
    prefix: 'Bài học',
  },
};

// Template theoryMd mặc định cho bài chưa có nội dung chi tiết
function generatePlaceholderTheoryMd(title: string, summary: string, level: number): string {
  return `# ${title}

## Tóm tắt

${summary}

## Từ vựng bài học

Học các từ vựng trong deck đính kèm trước khi đọc phần lý thuyết ngữ pháp.

## Ngữ pháp

> 📝 **Nội dung lý thuyết chi tiết đang được biên soạn.**
>
> Nội dung lý thuyết ngữ pháp tiếng Nhật cho bài học cấp độ N${level} này sẽ sớm được cập nhật tự động.
> Hiện tại bạn có thể:
> - Học và luyện tập từ vựng qua flashcard SM-2
> - Làm bài kiểm tra cuối bài để đánh giá mức độ ghi nhớ

## Mục tiêu bài học

- Nắm vững các từ vựng mới được phân bổ trong bài
- Làm quen và ứng dụng cấu trúc ngữ pháp tương ứng
- Đạt ≥ 70% trong bài kiểm tra cuối bài để mở khóa bài tiếp theo
`;
}

// Lấy tham số dòng lệnh
const LEVEL_ARG = process.argv[2] ?? 'all';

async function main() {
  console.log('🔍 Bắt đầu phân tích cấu trúc bài học cao cấp...\n');

  // 1. Lấy admin user để làm owner cho các deck mới tạo
  const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (!admin) {
    throw new Error('Admin user chưa tồn tại trong DB. Vui lòng chạy npm run seed trước.');
  }
  console.log(`✅ Admin: ${admin.email}`);

  // 2. Xác định các level cần xử lý
  let levelsToProcess: string[] = [];
  if (LEVEL_ARG === 'all') {
    levelsToProcess = ['4', '3', '2', '1'];
  } else {
    if (!COURSE_CONFIGS[LEVEL_ARG]) {
      throw new Error('Tham số cấp độ không hợp lệ. Vui lòng nhập từ 1 đến 4 hoặc "all".');
    }
    levelsToProcess = [LEVEL_ARG];
  }

  for (const lvl of levelsToProcess) {
    const config = COURSE_CONFIGS[lvl];
    console.log(`\n============================================================`);
    console.log(`📘 XỬ LÝ KHÓA HỌC: ${config.title} (N${config.jlptLevel})`);
    console.log(`============================================================`);

    // 2a. Khởi tạo / Cập nhật khóa học
    const course = await prisma.course.upsert({
      where: { slug: config.slug },
      update: {
        title: config.title,
        description: config.description,
        textbookRef: config.textbookRef,
        isDefault: true,
        isPublic: true,
      },
      create: {
        slug: config.slug,
        title: config.title,
        description: config.description,
        jlptLevel: config.jlptLevel,
        textbookRef: config.textbookRef,
        isDefault: true,
        isPublic: true,
      },
    });
    console.log(`✅ Course đã thiết lập trong DB. ID: ${course.id}`);

    // 2b. Lấy thẻ từ vựng từ Deck Jisho gốc
    const jishoCards = await prisma.card.findMany({
      where: { deckId: `jisho-tuvung-jlpt-n${config.jlptLevel}` },
      orderBy: { createdAt: 'asc' },
    });

    if (jishoCards.length === 0) {
      console.log(`⚠️ Bỏ qua cấp độ N${config.jlptLevel} vì Deck "jisho-tuvung-jlpt-n${config.jlptLevel}" không có từ vựng. Vui lòng cào dữ liệu trước.`);
      continue;
    }
    console.log(`✅ Tìm thấy ${jishoCards.length} từ vựng từ Jisho.`);

    // 2c. Tính toán phân chia từ vựng đều cho các bài học
    const cardsPerLesson = Math.floor(jishoCards.length / config.totalLessons);
    const extraCards = jishoCards.length % config.totalLessons;

    console.log(`📐 Chia đều: ${jishoCards.length} từ / ${config.totalLessons} bài học.`);
    console.log(`   → ${cardsPerLesson} từ/bài (${extraCards} bài học đầu sẽ có thêm 1 từ).\n`);

    let cardIndex = 0;

    // 2d. Tạo các bài học tuần tự
    for (let i = 0; i < config.totalLessons; i++) {
      const order = i + 1;
      
      // Số bài tương đương trong giáo trình (N4 bắt đầu từ bài 26 của Minna)
      const displayOrder = config.jlptLevel === 4 ? order + 25 : order;
      
      const count = cardsPerLesson + (i < extraCards ? 1 : 0);
      const batchCards = jishoCards.slice(cardIndex, cardIndex + count);
      cardIndex += count;

      const lessonTitle = `${config.prefix} ${displayOrder} — Từ vựng JLPT N${config.jlptLevel} (Phần ${order})`;
      const lessonSummary = `Học và rèn luyện ${batchCards.length} từ vựng JLPT N${config.jlptLevel} - Lớp bài học ${order}/${config.totalLessons}.`;

      // 1. Upsert Deck riêng cho bài học này
      const deckId = `jlpt-n${config.jlptLevel}-bai-${order}-vocab`;
      const deck = await prisma.deck.upsert({
        where: { id: deckId },
        update: {
          name: `${config.slug.toUpperCase()} — ${config.prefix} ${displayOrder} — Từ vựng`,
          description: `Từ vựng ${config.prefix.toLowerCase()} số ${displayOrder} cấp độ JLPT N${config.jlptLevel}.`,
        },
        create: {
          id: deckId,
          name: `${config.slug.toUpperCase()} — ${config.prefix} ${displayOrder} — Từ vựng`,
          description: `Từ vựng ${config.prefix.toLowerCase()} số ${displayOrder} cấp độ JLPT N${config.jlptLevel}.`,
          isPublic: true,
          category: 'TUVUNG',
          jlptLevel: config.jlptLevel,
          userId: admin.id,
        },
      });

      // 2. Copy/Upsert Cards vào Deck bài học
      for (let j = 0; j < batchCards.length; j++) {
        const src = batchCards[j];
        const cardId = `${deckId}-${j + 1}`;
        await prisma.card.upsert({
          where: { id: cardId },
          update: { front: src.front, back: src.back, romaji: src.romaji, example: src.example },
          create: {
            id: cardId,
            front: src.front,
            back: src.back,
            romaji: src.romaji ?? '',
            example: src.example ?? src.front,
            jlptLevel: config.jlptLevel,
            deckId: deck.id,
          },
        });
      }

      // 3. Upsert Lesson
      const lesson = await prisma.lesson.upsert({
        where: { courseId_order: { courseId: course.id, order: order } },
        update: {
          title: lessonTitle,
          summary: lessonSummary,
          skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
          estimatedMin: 30,
        },
        create: {
          courseId: course.id,
          order: order,
          title: lessonTitle,
          summary: lessonSummary,
          theoryMd: generatePlaceholderTheoryMd(lessonTitle, lessonSummary, config.jlptLevel),
          skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
          estimatedMin: 30,
        },
      });

      // 4. Liên kết Deck vào Lesson (LessonDeck)
      await prisma.lessonDeck.upsert({
        where: { lessonId_deckId: { lessonId: lesson.id, deckId: deck.id } },
        update: { role: LessonDeckRole.VOCAB, order: 0 },
        create: { lessonId: lesson.id, deckId: deck.id, role: LessonDeckRole.VOCAB, order: 0 },
      });

      // 5. Tạo bài Test cuối bài (LessonTest) làm Pool Quiz 10 câu
      const questionCount = Math.min(10, batchCards.length);
      await prisma.lessonTest.upsert({
        where: { lessonId: lesson.id },
        update: { deckId: deck.id, passScore: 70, questionCount },
        create: { lessonId: lesson.id, deckId: deck.id, passScore: 70, questionCount },
      });

      console.log(`   ✅ Bài ${displayOrder} (Lesson ${order}): Tạo thành công | Gắn Deck ${deck.name} (${batchCards.length} từ).`);
    }

    const lessonCount = await prisma.lesson.count({ where: { courseId: course.id } });
    console.log(`\n🎉 HOÀN THÀNH CẤP ĐỘ N${config.jlptLevel}! Khóa học "${config.slug}" có ${lessonCount} bài học.`);
  }

  console.log(`\n✨ Hoàn thành tất cả các yêu cầu cấu trúc lộ trình học tập!`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi tiến trình:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
