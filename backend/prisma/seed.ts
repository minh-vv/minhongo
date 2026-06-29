import { PrismaClient, DeckCategory, LessonDeckRole, SkillType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { MINNA_N5_LESSONS } from './seed/minna-n5';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('123456', 10);

  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@minhongo.com';
  const adminPassword = process.env.ADMIN_PASSWORD
    ? await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
    : password;

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      password: adminPassword,
      name: 'Admin',
      isAdmin: true,
    },
  });

  console.log('Admin:', admin.email);

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password,
      name: 'Test User',
    },
  });

  console.log('User:', user.email);

  // ========== HÁN TỰ (Kanji) ==========
  console.log('Đang dọn dẹp các khóa học Hán tự cũ...');
  await prisma.course.deleteMany({
    where: {
      slug: {
        in: ['kanji-n1', 'kanji-n2', 'kanji-n3', 'kanji-n4', 'kanji-n5']
      }
    }
  });

  console.log('Đang dọn dẹp các bộ thẻ Hán tự cũ...');
  await prisma.deck.deleteMany({
    where: {
      OR: [
        { id: { startsWith: 'hantu-jlpt-' } },
        { id: { in: ['hantu-jlpt-n1', 'hantu-jlpt-n2', 'hantu-jlpt-n3', 'hantu-jlpt-n4', 'hantu-jlpt-n5'] } }
      ]
    }
  });

  console.log('Đang nạp dữ liệu Kanji từ file JSON...');
  for (let lvl = 1; lvl <= 5; lvl++) {
    const jsonPath = path.join(__dirname, `data/kanji_n${lvl}.json`);
    if (fs.existsSync(jsonPath)) {
      const fileContent = fs.readFileSync(jsonPath, 'utf8');
      const kanjiData = JSON.parse(fileContent);
      
      const cardsPerLesson = 30;
      const totalLessons = Math.ceil(kanjiData.length / cardsPerLesson);
      console.log(`Đang seed ${kanjiData.length} thẻ Kanji vào ${totalLessons} bài học cho JLPT N${lvl}...`);

      const courseSlug = `kanji-n${lvl}`;
      const kanjiCourse = await prisma.course.upsert({
        where: { slug: courseSlug },
        update: {
          title: `2220 Kanji Master N${lvl}`,
          description: `Luyện tập chữ Hán tự JLPT N${lvl} bám sát giáo trình 2220 Kanji Master.`,
          jlptLevel: lvl,
          textbookRef: `2220 Kanji Master N${lvl}`,
          isPublic: true,
          isDefault: false,
        },
        create: {
          slug: courseSlug,
          title: `2220 Kanji Master N${lvl}`,
          description: `Luyện tập chữ Hán tự JLPT N${lvl} bám sát giáo trình 2220 Kanji Master.`,
          jlptLevel: lvl,
          textbookRef: `2220 Kanji Master N${lvl}`,
          isPublic: true,
          isDefault: false,
        },
      });
      
      for (let i = 0; i < totalLessons; i++) {
        const lessonNum = i + 1;
        const deckId = `hantu-jlpt-n${lvl}-bai-${lessonNum}`;
        const deckName = `2220 Kanji Master N${lvl} — Bài ${lessonNum}`;
        
        const kanjiDeck = await prisma.deck.upsert({
          where: { id: deckId },
          update: {
            name: deckName,
            description: `Bài học ${lessonNum} của giáo trình 2220 Kanji Master N${lvl}. Chữ Hán từ số ${i * cardsPerLesson + 1} đến ${Math.min((i + 1) * cardsPerLesson, kanjiData.length)}.`,
            isPublic: true,
            category: DeckCategory.HANTU,
            jlptLevel: lvl,
          },
          create: {
            id: deckId,
            name: deckName,
            description: `Bài học ${lessonNum} của giáo trình 2220 Kanji Master N${lvl}. Chữ Hán từ số ${i * cardsPerLesson + 1} đến ${Math.min((i + 1) * cardsPerLesson, kanjiData.length)}.`,
            isPublic: true,
            category: DeckCategory.HANTU,
            jlptLevel: lvl,
            userId: admin.id,
          },
        });

        const lesson = await prisma.lesson.upsert({
          where: { courseId_order: { courseId: kanjiCourse.id, order: lessonNum } },
          update: {
            title: `Bài ${lessonNum}`,
            summary: `Học các chữ Hán tự bài ${lessonNum}`,
            theoryMd: `## Hướng dẫn học chữ Hán Bài ${lessonNum}\n\nHọc cách viết và cách đọc Onyomi/Kunyomi của các chữ Hán tự từ số ${i * cardsPerLesson + 1} đến ${Math.min((i + 1) * cardsPerLesson, kanjiData.length)} trong bài.\nNhấp vào **Thẻ ghi nhớ** để ôn tập và luyện viết nét trực tuyến.`,
            skills: [SkillType.KANJI],
            estimatedMin: 30,
          },
          create: {
            courseId: kanjiCourse.id,
            order: lessonNum,
            title: `Bài ${lessonNum}`,
            summary: `Học các chữ Hán tự bài ${lessonNum}`,
            theoryMd: `## Hướng dẫn học chữ Hán Bài ${lessonNum}\n\nHọc cách viết và cách đọc Onyomi/Kunyomi của các chữ Hán tự từ số ${i * cardsPerLesson + 1} đến ${Math.min((i + 1) * cardsPerLesson, kanjiData.length)} trong bài.\nNhấp vào **Thẻ ghi nhớ** để ôn tập và luyện viết nét trực tuyến.`,
            skills: [SkillType.KANJI],
            estimatedMin: 30,
          },
        });

        await prisma.lessonDeck.upsert({
          where: { lessonId_deckId: { lessonId: lesson.id, deckId: kanjiDeck.id } },
          update: {
            role: LessonDeckRole.KANJI,
            order: 0,
          },
          create: {
            lessonId: lesson.id,
            deckId: kanjiDeck.id,
            role: LessonDeckRole.KANJI,
            order: 0,
          },
        });

        await prisma.lessonTest.upsert({
          where: { lessonId: lesson.id },
          update: {
            deckId: kanjiDeck.id,
            passScore: 70,
            questionCount: Math.min(10, cardsPerLesson),
          },
          create: {
            lessonId: lesson.id,
            deckId: kanjiDeck.id,
            passScore: 70,
            questionCount: Math.min(10, cardsPerLesson),
          },
        });

        const lessonCards = kanjiData.slice(i * cardsPerLesson, (i + 1) * cardsPerLesson);
        for (const kanji of lessonCards) {
          await prisma.card.upsert({
            where: { id: `hantu-n${lvl}-${kanji.front}` },
            update: {
              back: kanji.back,
              romaji: kanji.romaji,
              jlptLevel: kanji.jlptLevel,
              deckId: kanjiDeck.id,
            },
            create: {
              id: `hantu-n${lvl}-${kanji.front}`,
              front: kanji.front,
              back: kanji.back,
              romaji: kanji.romaji,
              jlptLevel: kanji.jlptLevel,
              deckId: kanjiDeck.id,
            },
          });
        }
      }
    }
  }

  // ========== TỪ VỰNG (Vocabulary) ==========
  const vocabDeckN5 = await prisma.deck.upsert({
    where: { id: 'tuvung-jlpt-n5' },
    update: {},
    create: {
      id: 'tuvung-jlpt-n5',
      name: 'Từ vựng N5',
      description: 'Từ vựng N5 phổ biến cho người mới bắt đầu',
      isPublic: true,
      category: DeckCategory.TUVUNG,
      jlptLevel: 5,
      userId: user.id,
    },
  });

  const vocabData = [
    { front: 'こんにちは', back: 'Xin chào', romaji: 'Konnichiwa', jlptLevel: 5 },
    { front: 'ありがとう', back: 'Cảm ơn', romaji: 'Arigatou', jlptLevel: 5 },
    { front: 'すみません', back: 'Xin lỗi', romaji: 'Sumimasen', jlptLevel: 5 },
    { front: 'はい', back: 'Vâng/Có', romaji: 'Hai', jlptLevel: 5 },
    { front: 'いいえ', back: 'Không', romaji: 'Iie', jlptLevel: 5 },
    { front: '日本', back: 'Nhật Bản', romaji: 'Nihon', jlptLevel: 5 },
    { front: '学生', back: 'Học sinh', romaji: 'Gakusei', jlptLevel: 5 },
    { front: '先生', back: 'Thầy/Cô giáo', romaji: 'Sensei', jlptLevel: 5 },
    { front: '学校', back: 'Trường học', romaji: 'Gakkou', jlptLevel: 5 },
    { front: '本', back: 'Sách', romaji: 'Hon', jlptLevel: 5 },
  ];

  for (const vocab of vocabData) {
    await prisma.card.upsert({
      where: { id: `vocab-${vocab.front}` },
      update: {},
      create: {
        id: `vocab-${vocab.front}`,
        front: vocab.front,
        back: vocab.back,
        romaji: vocab.romaji,
        jlptLevel: vocab.jlptLevel,
        example: `こんにちは、${vocab.front}。`,
        deckId: vocabDeckN5.id,
      },
    });
  }

  console.log(`Created ${vocabData.length} vocabulary cards`);

  // ========== NGỮ PHÁP (Grammar) ==========
  const grammarDeckN5 = await prisma.deck.upsert({
    where: { id: 'nguphap-jlpt-n5' },
    update: {},
    create: {
      id: 'nguphap-jlpt-n5',
      name: 'Ngữ pháp N5',
      description: 'Cấu trúc ngữ pháp N5 cơ bản',
      isPublic: true,
      category: DeckCategory.NGUPHAP,
      jlptLevel: 5,
      userId: user.id,
    },
  });

  const grammarData = [
    { front: 'は (wa)', back: 'Trợ từ chủ đề', romaji: 'wa', jlptLevel: 5 },
    { front: 'が (ga)', back: 'Trợ từ chủ ngữ', romaji: 'ga', jlptLevel: 5 },
    { front: 'を (wo/o)', back: 'Trợ từ đối tượng', romaji: 'wo', jlptLevel: 5 },
    { front: 'に (ni)', back: 'Trợ từ thời gian/địa điểm', romaji: 'ni', jlptLevel: 5 },
    { front: 'で (de)', back: 'Trợ từ nơi chốn/phương tiện', romaji: 'de', jlptLevel: 5 },
    { front: 'です/だ', back: 'Là (động từ to be)', romaji: 'desu/da', jlptLevel: 5 },
    { front: 'ます (masu)', back: 'Đuôi động từ lịch sự', romaji: 'masu', jlptLevel: 5 },
    { front: 'ません (masen)', back: 'Phủ định lịch sự', romaji: 'masen', jlptLevel: 5 },
    { front: 'ました (mashita)', back: 'Quá khứ lịch sự', romaji: 'mashita', jlptLevel: 5 },
    { front: 'ませんした (masendeshita)', back: 'Quá khứ phủ định', romaji: 'masendeshita', jlptLevel: 5 },
  ];

  for (const grammar of grammarData) {
    await prisma.card.upsert({
      where: { id: `grammar-${grammar.front.replace(/[^a-zA-Z]/g, '')}` },
      update: {},
      create: {
        id: `grammar-${grammar.front.replace(/[^a-zA-Z]/g, '')}`,
        front: grammar.front,
        back: grammar.back,
        romaji: grammar.romaji,
        jlptLevel: grammar.jlptLevel,
        example: `私は学生です。(Watashi wa gakusei desu.)`,
        deckId: grammarDeckN5.id,
      },
    });
  }

  console.log(`Created ${grammarData.length} grammar cards`);

  // ========== TỰ HỌC (User's own deck) ==========
  await prisma.deck.upsert({
    where: { id: 'demo-deck-jlpt-n5' },
    update: {},
    create: {
      id: 'demo-deck-jlpt-n5',
      name: 'Deck mẫu của tôi',
      description: 'Deck mẫu để bạn thực hành',
      isPublic: true,
      category: DeckCategory.TUHOC,
      jlptLevel: 5,
      userId: user.id,
    },
  });

  // ========== COURSE: MINNA NO NIHONGO N5 ==========
  // Lộ trình mặc định cho người mới bắt đầu, bám theo cấu trúc bài Minna.
  // Nội dung được viết lại bằng tiếng Việt — không sao chép từ sách gốc.
  const minnaN5 = await prisma.course.upsert({
    where: { slug: 'minna-n5' },
    update: {
      title: 'Minna no Nihongo I — JLPT N5',
      description:
        'Lộ trình học tiếng Nhật cho người mới bắt đầu, bám cấu trúc 25 bài của Minna no Nihongo I. MVP hiện có 5 bài đầu.',
      jlptLevel: 5,
      textbookRef: 'Minna no Nihongo I',
      isDefault: true,
      isPublic: true,
    },
    create: {
      slug: 'minna-n5',
      title: 'Minna no Nihongo I — JLPT N5',
      description:
        'Lộ trình học tiếng Nhật cho người mới bắt đầu, bám cấu trúc 25 bài của Minna no Nihongo I. MVP hiện có 5 bài đầu.',
      jlptLevel: 5,
      textbookRef: 'Minna no Nihongo I',
      isDefault: true,
      isPublic: true,
    },
  });

  for (const lessonData of MINNA_N5_LESSONS) {
    // Tạo deck từ vựng cho bài
    const vocabDeckId = `minna-n5-bai-${lessonData.order}-vocab`;
    const vocabDeck = await prisma.deck.upsert({
      where: { id: vocabDeckId },
      update: {
        name: `Minna N5 — Bài ${lessonData.order} — Từ vựng`,
        description: `Từ vựng bài ${lessonData.order}: ${lessonData.title}`,
        isPublic: true,
        category: DeckCategory.TUVUNG,
        jlptLevel: 5,
      },
      create: {
        id: vocabDeckId,
        name: `Minna N5 — Bài ${lessonData.order} — Từ vựng`,
        description: `Từ vựng bài ${lessonData.order}: ${lessonData.title}`,
        isPublic: true,
        category: DeckCategory.TUVUNG,
        jlptLevel: 5,
        userId: admin.id,
      },
    });

    // Thêm các thẻ vào deck (upsert mỗi thẻ theo id để idempotent)
    for (let i = 0; i < lessonData.vocab.length; i++) {
      const v = lessonData.vocab[i];
      const cardId = `${vocabDeckId}-${i + 1}`;
      await prisma.card.upsert({
        where: { id: cardId },
        update: {
          front: v.front,
          back: v.back,
          romaji: v.romaji,
          example: v.example,
          jlptLevel: 5,
        },
        create: {
          id: cardId,
          front: v.front,
          back: v.back,
          romaji: v.romaji,
          example: v.example,
          jlptLevel: 5,
          deckId: vocabDeck.id,
        },
      });
    }

    // Tạo Lesson
    const lesson = await prisma.lesson.upsert({
      where: { courseId_order: { courseId: minnaN5.id, order: lessonData.order } },
      update: {
        title: lessonData.title,
        summary: lessonData.summary,
        theoryMd: lessonData.theoryMd,
        skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
        estimatedMin: 30,
      },
      create: {
        courseId: minnaN5.id,
        order: lessonData.order,
        title: lessonData.title,
        summary: lessonData.summary,
        theoryMd: lessonData.theoryMd,
        skills: [SkillType.VOCABULARY, SkillType.GRAMMAR],
        estimatedMin: 30,
      },
    });

    // Gắn deck từ vựng vào lesson
    await prisma.lessonDeck.upsert({
      where: { lessonId_deckId: { lessonId: lesson.id, deckId: vocabDeck.id } },
      update: { role: LessonDeckRole.VOCAB, order: 0 },
      create: {
        lessonId: lesson.id,
        deckId: vocabDeck.id,
        role: LessonDeckRole.VOCAB,
        order: 0,
      },
    });

    // Tạo LessonTest dùng chính deck từ vựng làm pool quiz
    await prisma.lessonTest.upsert({
      where: { lessonId: lesson.id },
      update: {
        deckId: vocabDeck.id,
        passScore: 70,
        questionCount: Math.min(10, lessonData.vocab.length),
      },
      create: {
        lessonId: lesson.id,
        deckId: vocabDeck.id,
        passScore: 70,
        questionCount: Math.min(10, lessonData.vocab.length),
      },
    });
  }

  console.log(`Created course "minna-n5" với ${MINNA_N5_LESSONS.length} bài`);

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
