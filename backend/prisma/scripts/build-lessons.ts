/**
 * Script tạo lesson 6-25 cho course Minna N5,
 * lấy từ vựng từ deck Jisho đã cào và chia đều vào từng bài.
 *
 * Chạy: npm run build:lessons
 * Yêu cầu: DB đang chạy + đã seed + đã crawl:jisho
 */

import { PrismaClient, LessonDeckRole, SkillType } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ============================================================
// CẤU HÌNH BÀI 6-25 (tiêu đề + tóm tắt theo Minna no Nihongo)
// ============================================================

const LESSON_META: { order: number; title: string; summary: string; skills: SkillType[] }[] = [
  {
    order: 6,
    title: 'Bài 6 — Động từ nhóm 1 thể ます (Ăn, Uống, Nghe...)',
    summary: 'Động từ nhóm 1, trợ từ を cho tân ngữ, から/まで thời gian.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 7,
    title: 'Bài 7 — Địa điểm + Động từ di chuyển nâng cao',
    summary: 'に chỉ điểm đến, で chỉ phương tiện, と cùng với ai, ひとりで.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 8,
    title: 'Bài 8 — Tính từ đuôi い và な',
    summary: 'Hai loại tính từ, cách chia phủ định và quá khứ.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 9,
    title: 'Bài 9 — Danh từ + があります/います',
    summary: 'Diễn đạt "có/tồn tại" cho vật và người, vị trí với に.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 10,
    title: 'Bài 10 — Đếm đồ vật và con người',
    summary: 'Lượng từ đếm: 枚, 本, 冊, 台, 匹... và câu hỏi いくつ/なんまい.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 11,
    title: 'Bài 11 — Muốn làm gì: ～たい',
    summary: 'Diễn đạt mong muốn với たい, hỏi và đáp về sở thích.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 12,
    title: 'Bài 12 — Lời mời và đề nghị: ～ませんか / ましょう',
    summary: 'Cách mời ai làm gì cùng, từ chối lịch sự.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 13,
    title: 'Bài 13 — Trợ từ で (phương tiện/nơi chốn) nâng cao',
    summary: 'で chỉ nguyên liệu, ngôn ngữ, phương tiện; と cùng nhau.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 14,
    title: 'Bài 14 — Cho và nhận: あげます/もらいます/くれます',
    summary: 'Ba động từ trao đổi cơ bản và hướng trao đổi.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 15,
    title: 'Bài 15 — Thể て (1): Nối câu và yêu cầu',
    summary: 'Chia động từ thể て, mẫu ～てください, ～ています.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 16,
    title: 'Bài 16 — Thể て (2): ～ています trạng thái',
    summary: 'Phân biệt ～ています tiếp diễn vs trạng thái kết quả.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 17,
    title: 'Bài 17 — Thể た (Quá khứ tự nhiên) và ～たことがあります',
    summary: 'Chia thể た, nói về trải nghiệm quá khứ.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 18,
    title: 'Bài 18 — Thể た: ～たり～たりします',
    summary: 'Liệt kê hành động không theo thứ tự với ～たり～たり.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 19,
    title: 'Bài 19 — Thể ない: Phủ định dạng tự nhiên',
    summary: 'Chia thể ない, ～なければなりません, ～なくてもいいです.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 20,
    title: 'Bài 20 — Thể từ điển: Khả năng và cho phép',
    summary: '～ことができます (có thể), ～てもいいです (được phép).',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 21,
    title: 'Bài 21 — Danh từ hóa: ～こと và ～の',
    summary: 'Biến mệnh đề thành danh từ, sở thích, khả năng.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 22,
    title: 'Bài 22 — Điều kiện: ～とき và ～まえに/あとで',
    summary: 'Diễn đạt thời điểm, trước/sau hành động.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 23,
    title: 'Bài 23 — Thể bình thường trong hội thoại',
    summary: 'Chuyển từ thể lịch sự sang thể bình thường (casual).',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 24,
    title: 'Bài 24 — Điều kiện: ～と、～ば、～たら',
    summary: 'Ba cấu trúc điều kiện và sự khác biệt về sắc thái.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
  },
  {
    order: 25,
    title: 'Bài 25 — Ôn tập tổng kết N5',
    summary: 'Tổng hợp toàn bộ ngữ pháp N5, luyện tập tổng hợp.',
    skills: [SkillType.VOCABULARY, SkillType.GRAMMAR, SkillType.READING],
  },
];

// Template theoryMd mặc định cho bài chưa có nội dung chi tiết
function generateTheoryMd(lesson: (typeof LESSON_META)[0]): string {
  return `# ${lesson.title}

## Tóm tắt

${lesson.summary}

## Từ vựng bài học

Học các từ vựng trong deck đính kèm trước khi đọc phần ngữ pháp.

## Ngữ pháp

> 📝 **Nội dung chi tiết đang được biên soạn.**
>
> Phần lý thuyết cho bài này sẽ được cập nhật sớm.
> Hiện tại bạn có thể:
> - Luyện tập từ vựng qua flashcard SM-2
> - Làm bài kiểm tra để đánh giá mức độ ghi nhớ

## Mục tiêu bài học

- Nắm vững ${Math.floor(Math.random() * 10) + 20}–${Math.floor(Math.random() * 10) + 30} từ vựng mới
- Hiểu và ứng dụng cấu trúc ngữ pháp trong bài
- Đạt ≥ 70% trong bài kiểm tra cuối bài để mở khóa bài tiếp theo
`;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('🔍 Kiểm tra dữ liệu trong DB...\n');

  // 1. Lấy course minna-n5
  const course = await prisma.course.findUnique({
    where: { slug: 'minna-n5' },
    include: { _count: { select: { lessons: true } } },
  });

  if (!course) {
    throw new Error('Course "minna-n5" chưa tồn tại. Hãy chạy: npm run seed');
  }

  console.log(`✅ Course: "${course.title}" — hiện có ${course._count.lessons} bài`);

  // 2. Lấy admin user
  const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (!admin) throw new Error('Admin user chưa tồn tại. Hãy chạy: npm run seed');

  console.log(`✅ Admin: ${admin.email}`);

  // 3. Lấy tất cả cards từ deck Jisho đã cào
  const jishoCards = await prisma.card.findMany({
    where: { deckId: 'jisho-tuvung-jlpt-n5' },
    orderBy: { createdAt: 'asc' },
  });

  if (jishoCards.length === 0) {
    throw new Error('Deck "jisho-tuvung-jlpt-n5" chưa có card. Hãy chạy: npm run crawl:jisho');
  }

  console.log(`✅ Jisho deck: ${jishoCards.length} cards`);

  // 4. Tính số cards mỗi bài (chia đều cho 20 bài 6-25)
  const totalNewLessons = LESSON_META.length; // 20 bài
  const cardsPerLesson = Math.floor(jishoCards.length / totalNewLessons);
  const extraCards = jishoCards.length % totalNewLessons;

  console.log(`\n📐 Chia đều: ${jishoCards.length} từ / ${totalNewLessons} bài`);
  console.log(`   → ${cardsPerLesson} từ/bài (${extraCards} bài đầu có thêm 1 từ)\n`);

  // 5. Tạo từng bài 6-25
  let cardIndex = 0;

  for (let i = 0; i < LESSON_META.length; i++) {
    const meta = LESSON_META[i];
    const count = cardsPerLesson + (i < extraCards ? 1 : 0);
    const batchCards = jishoCards.slice(cardIndex, cardIndex + count);
    cardIndex += count;

    console.log(`📖 Bài ${meta.order}: "${meta.title}"`);
    console.log(`   → ${batchCards.length} từ vựng`);

    // 5a. Tạo deck riêng cho bài này
    const deckId = `minna-n5-bai-${meta.order}-vocab`;
    const deck = await prisma.deck.upsert({
      where: { id: deckId },
      update: {
        name: `Minna N5 — Bài ${meta.order} — Từ vựng`,
        description: `Từ vựng bài ${meta.order}: ${meta.title}`,
      },
      create: {
        id: deckId,
        name: `Minna N5 — Bài ${meta.order} — Từ vựng`,
        description: `Từ vựng bài ${meta.order}: ${meta.title}`,
        isPublic: true,
        category: 'TUVUNG',
        jlptLevel: 5,
        userId: admin.id,
      },
    });

    // 5b. Copy cards từ Jisho deck vào deck này
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
          jlptLevel: 5,
          deckId: deck.id,
        },
      });
    }

    // 5c. Tạo Lesson
    const lesson = await prisma.lesson.upsert({
      where: { courseId_order: { courseId: course.id, order: meta.order } },
      update: {
        title: meta.title,
        summary: meta.summary,
        skills: meta.skills,
        estimatedMin: 30,
      },
      create: {
        courseId: course.id,
        order: meta.order,
        title: meta.title,
        summary: meta.summary,
        theoryMd: generateTheoryMd(meta),
        skills: meta.skills,
        estimatedMin: 30,
      },
    });

    // 5d. Gắn deck vào lesson (LessonDeck)
    await prisma.lessonDeck.upsert({
      where: { lessonId_deckId: { lessonId: lesson.id, deckId: deck.id } },
      update: { role: LessonDeckRole.VOCAB, order: 0 },
      create: { lessonId: lesson.id, deckId: deck.id, role: LessonDeckRole.VOCAB, order: 0 },
    });

    // 5e. Tạo LessonTest dùng deck này làm pool quiz
    const questionCount = Math.min(10, batchCards.length);
    await prisma.lessonTest.upsert({
      where: { lessonId: lesson.id },
      update: { deckId: deck.id, passScore: 70, questionCount },
      create: { lessonId: lesson.id, deckId: deck.id, passScore: 70, questionCount },
    });

    console.log(`   ✅ Lesson ID: ${lesson.id} | Deck ID: ${deck.id}`);
  }

  // 6. Tổng kết
  const finalCount = await prisma.lesson.count({ where: { courseId: course.id } });
  console.log(`\n🎉 Hoàn thành! Course "minna-n5" giờ có ${finalCount} bài học.`);
  console.log(`   Bài 1-5:   Nội dung chi tiết (từ seed)`);
  console.log(`   Bài 6-25:  Từ vựng Jisho (${jishoCards.length} từ chia đều)`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
