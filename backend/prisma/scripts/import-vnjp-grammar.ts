import { PrismaClient, DeckCategory, LessonDeckRole, SkillType } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ScrapedVNJP {
  front: string;
  back: string;
  romaji: string;
  example: string;
  jlptLevel: number;
}

interface CourseConfig {
  slug: string;
  title: string;
  description: string;
  textbookRef: string;
  totalLessons: number;
  prefix: string; // e.g. "Bài" or "Bài học"
}

const COURSE_CONFIGS: Record<number, CourseConfig> = {
  5: {
    slug: 'minna-n5',
    title: 'Minna no Nihongo I — JLPT N5',
    description: 'Lộ trình học từ vựng và lý thuyết cấp độ JLPT N5 theo giáo trình Minna no Nihongo I (Bài 1 → 25).',
    textbookRef: 'Minna no Nihongo I',
    totalLessons: 25,
    prefix: 'Bài',
  },
  4: {
    slug: 'minna-n4',
    title: 'Minna no Nihongo II — JLPT N4',
    description: 'Lộ trình học từ vựng và lý thuyết cấp độ JLPT N4 theo giáo trình Minna no Nihongo II (Bài 26 → 50).',
    textbookRef: 'Minna no Nihongo II',
    totalLessons: 25,
    prefix: 'Bài',
  },
  3: {
    slug: 'jlpt-n3',
    title: 'JLPT N3 — Lộ trình học tổng hợp',
    description: 'Lộ trình từ vựng và ngữ pháp tổng hợp chuẩn JLPT N3 biên soạn theo giáo trình Soumatome & Shinkanzen Master N3.',
    textbookRef: 'Soumatome & Shinkanzen N3',
    totalLessons: 50,
    prefix: 'Bài học',
  },
  2: {
    slug: 'jlpt-n2',
    title: 'JLPT N2 — Lộ trình học tổng hợp',
    description: 'Lộ trình từ vựng và ngữ pháp nâng cao cấp độ JLPT N2 biên soạn theo giáo trình Soumatome & Shinkanzen Master N2.',
    textbookRef: 'Soumatome & Shinkanzen N2',
    totalLessons: 50,
    prefix: 'Bài học',
  },
  1: {
    slug: 'jlpt-n1',
    title: 'JLPT N1 — Lộ trình học tổng hợp',
    description: 'Lộ trình từ vựng và lý thuyết cao cấp nhất cấp độ JLPT N1 biên soạn theo giáo trình Soumatome & Shinkanzen Master N1.',
    textbookRef: 'Soumatome & Shinkanzen N1',
    totalLessons: 80,
    prefix: 'Bài học',
  },
};

const DECK_NAMES: Record<number, { name: string; desc: string }> = {
  5: {
    name: 'Minna no Nihongo - Ngữ pháp N5',
    desc: 'Tổng hợp cấu trúc ngữ pháp N5 cơ bản dựa theo giáo trình Minna no Nihongo.',
  },
  4: {
    name: 'Minna no Nihongo - Ngữ pháp N4',
    desc: 'Tổng hợp cấu trúc ngữ pháp N4 trung cấp dựa theo giáo trình Minna no Nihongo.',
  },
  3: {
    name: 'Soumatome & Shinkanzen - Ngữ pháp N3',
    desc: 'Tổng hợp cấu trúc ngữ pháp N3 trung cấp dựa theo giáo trình Soumatome và Shinkanzen Master N3.',
  },
  2: {
    name: 'Soumatome & Shinkanzen - Ngữ pháp N2',
    desc: 'Tổng hợp cấu trúc ngữ pháp N2 thượng cấp dựa theo giáo trình Soumatome và Shinkanzen Master N2.',
  },
  1: {
    name: 'Soumatome & Shinkanzen - Ngữ pháp N1',
    desc: 'Tổng hợp cấu trúc ngữ pháp N1 cao cấp nhất dựa theo giáo trình Soumatome và Shinkanzen Master N1.',
  },
};

function cleanText(str: string): string {
  if (!str) return '';
  return str
    .replace(/&#8211;/g, '–')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function generatePlaceholderTheoryMd(title: string, summary: string, level: number): string {
  return `# ${title}

## Tóm tắt

${summary}

## Ngữ pháp bài học

Học các thẻ ngữ pháp trong bài trước khi làm bài kiểm tra.

## Cấu trúc chi tiết

> 📝 **Nội dung lý thuyết chi tiết đang được biên soạn.**
>
> Nội dung lý thuyết ngữ pháp tiếng Nhật cho bài học cấp độ N${level} này sẽ sớm được cập nhật tự động.
`;
}

async function main() {
  const levelArg = process.argv[2];
  if (!levelArg || !['5', '4', '3', '2', '1'].includes(levelArg)) {
    throw new Error('❌ Vui lòng truyền tham số cấp độ jlpt (5, 4, 3, 2, 1). Ví dụ: npx ts-node prisma/scripts/import-vnjp-grammar.ts 3');
  }
  const level = parseInt(levelArg, 10);

  console.log(`🚀 Bắt đầu import dữ liệu ngữ pháp N${level} vào cơ sở dữ liệu...`);

  // 1. Tìm admin user làm chủ sở hữu deck
  const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (!admin) {
    throw new Error('❌ Không tìm thấy tài khoản Admin để sở hữu deck! Hãy chạy npm run seed trước.');
  }
  console.log(`👤 Admin phụ trách: ${admin.email}`);

  // 2. Tìm file dữ liệu cào
  let dataPath = path.join(__dirname, `parsed-vnjp-grammar-n${level}.json`);
  if (!fs.existsSync(dataPath)) {
    // Thử fallback cho N4 và N5 nếu cào bằng phiên bản crawler cũ
    const fallbackPath = path.join(__dirname, 'parsed-vnjp-grammar.json');
    if ((level === 5 || level === 4) && fs.existsSync(fallbackPath)) {
      dataPath = fallbackPath;
      console.log(`⚠️ Không tìm thấy parsed-vnjp-grammar-n${level}.json. Sử dụng fallback file chung.`);
    } else {
      throw new Error(`❌ Không tìm thấy file dữ liệu: ${dataPath}. Hãy chắc chắn crawler đã chạy xong!`);
    }
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  let grammarPoints: ScrapedVNJP[] = JSON.parse(rawData);

  // Lọc nếu sử dụng file fallback chung
  if (dataPath.endsWith('parsed-vnjp-grammar.json')) {
    grammarPoints = grammarPoints.filter((p) => p.jlptLevel === level);
  }

  console.log(`📚 Đọc thành công ${grammarPoints.length} điểm ngữ pháp từ file JSON.`);
  if (grammarPoints.length === 0) {
    console.log('⚠️ Không có điểm ngữ pháp nào để xử lý. Kết thúc.');
    return;
  }

  // 3. Đảm bảo deck tổng tồn tại
  const deckConfig = DECK_NAMES[level];
  const masterDeckId = `nguphap-vnjp-n${level}`;
  const masterDeck = await prisma.deck.upsert({
    where: { id: masterDeckId },
    update: {
      name: deckConfig.name,
      description: deckConfig.desc,
      category: DeckCategory.NGUPHAP,
      isPublic: true,
      jlptLevel: level,
    },
    create: {
      id: masterDeckId,
      name: deckConfig.name,
      description: deckConfig.desc,
      category: DeckCategory.NGUPHAP,
      isPublic: true,
      jlptLevel: level,
      userId: admin.id,
    },
  });
  console.log(`✅ Deck tổng: ${masterDeck.id} ("${masterDeck.name}")`);

  // 4. Đồng bộ Khóa học (Course)
  const courseConfig = COURSE_CONFIGS[level];
  const course = await prisma.course.upsert({
    where: { slug: courseConfig.slug },
    update: {
      title: courseConfig.title,
      description: courseConfig.description,
      textbookRef: courseConfig.textbookRef,
      isDefault: true,
      isPublic: true,
    },
    create: {
      slug: courseConfig.slug,
      title: courseConfig.title,
      description: courseConfig.description,
      jlptLevel: level,
      textbookRef: courseConfig.textbookRef,
      isDefault: true,
      isPublic: true,
    },
  });
  console.log(`✅ Khóa học: ${course.slug} ("${course.title}")`);

  // 5. Phân bổ các điểm ngữ pháp vào từng Bài học (Lesson)
  const totalLessons = courseConfig.totalLessons;
  const cardsPerLesson = Math.floor(grammarPoints.length / totalLessons);
  const extraCards = grammarPoints.length % totalLessons;

  console.log(`📐 Phân chia ngữ pháp: ${grammarPoints.length} mẫu / ${totalLessons} bài.`);
  console.log(`   → ${cardsPerLesson} mẫu/bài (${extraCards} bài đầu có thêm 1 mẫu)`);

  let cardIndex = 0;

  for (let order = 1; order <= totalLessons; order++) {
    const displayOrder = level === 4 ? order + 25 : order;
    const count = cardsPerLesson + (order <= extraCards ? 1 : 0);
    const batchCards = grammarPoints.slice(cardIndex, cardIndex + count);
    cardIndex += count;

    // 5a. Tìm hoặc tạo Lesson
    const lessonTitle = `${courseConfig.prefix} ${displayOrder} — Ngữ pháp`;
    const lessonSummary = `Tổng hợp cấu trúc ngữ pháp thuộc ${courseConfig.prefix.toLowerCase()} số ${displayOrder} cấp độ JLPT N${level}.`;
    
    // Check if lesson exists, otherwise create
    const lesson = await prisma.lesson.upsert({
      where: { courseId_order: { courseId: course.id, order: order } },
      update: {
        title: lessonTitle,
        summary: lessonSummary,
      },
      create: {
        courseId: course.id,
        order: order,
        title: lessonTitle,
        summary: lessonSummary,
        theoryMd: generatePlaceholderTheoryMd(lessonTitle, lessonSummary, level),
        skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
        estimatedMin: 30,
      },
    });

    // 5b. Tạo Lesson Deck ngữ pháp con
    const lessonDeckId = `nguphap-vnjp-n${level}-bai-${order}`;
    const lessonDeck = await prisma.deck.upsert({
      where: { id: lessonDeckId },
      update: {
        name: `${courseConfig.slug.toUpperCase()} — ${courseConfig.prefix} ${displayOrder} — Ngữ pháp`,
        description: `Ngữ pháp ${courseConfig.prefix.toLowerCase()} số ${displayOrder} cấp độ JLPT N${level}.`,
      },
      create: {
        id: lessonDeckId,
        name: `${courseConfig.slug.toUpperCase()} — ${courseConfig.prefix} ${displayOrder} — Ngữ pháp`,
        description: `Ngữ pháp ${courseConfig.prefix.toLowerCase()} số ${displayOrder} cấp độ JLPT N${level}.`,
        isPublic: true,
        category: DeckCategory.NGUPHAP,
        jlptLevel: level,
        userId: admin.id,
      },
    });

    // 5c. Gắn Deck ngữ pháp vào Lesson
    await prisma.lessonDeck.upsert({
      where: { lessonId_deckId: { lessonId: lesson.id, deckId: lessonDeck.id } },
      update: { role: LessonDeckRole.GRAMMAR, order: 1 },
      create: { lessonId: lesson.id, deckId: lessonDeck.id, role: LessonDeckRole.GRAMMAR, order: 1 },
    });

    // 5d. Lưu thẻ học vào cả Deck Tổng và Deck Bài học con
    for (let j = 0; j < batchCards.length; j++) {
      const p = batchCards[j];
      const front = cleanText(p.front);
      const back = cleanText(p.back);
      const romaji = p.romaji;
      const example = cleanText(p.example);

      // Card ở Deck tổng
      const masterCardId = `vnjp-grammar-${level}-${romaji}`;
      await prisma.card.upsert({
        where: { id: masterCardId },
        update: { front, back, romaji, example, jlptLevel: level, deckId: masterDeck.id },
        create: { id: masterCardId, front, back, romaji, example, jlptLevel: level, deckId: masterDeck.id },
      });

      // Card ở Deck bài học con
      const lessonCardId = `vnjp-grammar-${level}-bai-${order}-${romaji}`;
      await prisma.card.upsert({
        where: { id: lessonCardId },
        update: { front, back, romaji, example, jlptLevel: level, deckId: lessonDeck.id },
        create: { id: lessonCardId, front, back, romaji, example, jlptLevel: level, deckId: lessonDeck.id },
      });
    }

    if (batchCards.length > 0) {
      console.log(`   ✅ Bài ${displayOrder} (Lesson ${order}): Tạo xong Deck con ${lessonDeck.name} chứa ${batchCards.length} thẻ ngữ pháp.`);
    }
  }

  console.log(`\n🎉 HOÀN THÀNH TIẾN TRÌNH IMPORT N${level}!`);
  console.log(`   ✅ Tổng số điểm ngữ pháp đã xử lý: ${grammarPoints.length}`);
  console.log(`   ✅ Master Deck: ${masterDeck.id} ("${masterDeck.name}")`);
  console.log(`   ✅ Các bài học đã được liên kết Deck Ngữ pháp tương ứng.`);
  console.log(`============================================================\n`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi tiến trình import:', e.message);
  })
  .finally(() => {
    prisma.$disconnect();
  });
