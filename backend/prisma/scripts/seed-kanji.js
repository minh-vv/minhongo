const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv/config');

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '..', 'data');

async function main() {
  console.log('\n📥 Bắt đầu seed dữ liệu Hán tự (Kanji)...');

  // 1. Đảm bảo có tài khoản admin
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@minhongo.com';
  let admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  
  if (!admin) {
    console.log(`  ➕ Tạo tài khoản admin mặc định: ${adminEmail}`);
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('123456', 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: passwordHash,
        name: 'Admin',
        isAdmin: true,
      },
    });
  } else {
    console.log(`  ✅ Sử dụng tài khoản admin hiện tại: ${admin.email}`);
  }

  // 2. Seed Kanji
  for (let lvl = 1; lvl <= 5; lvl++) {
    const jsonPath = path.join(DATA_DIR, `kanji_n${lvl}.json`);
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
            category: "HANTU",
            jlptLevel: lvl,
          },
          create: {
            id: deckId,
            name: deckName,
            description: `Bài học ${lessonNum} của giáo trình 2220 Kanji Master N${lvl}. Chữ Hán từ số ${i * cardsPerLesson + 1} đến ${Math.min((i + 1) * cardsPerLesson, kanjiData.length)}.`,
            isPublic: true,
            category: "HANTU",
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
            skills: ["KANJI"],
            estimatedMin: 30,
          },
          create: {
            courseId: kanjiCourse.id,
            order: lessonNum,
            title: `Bài ${lessonNum}`,
            summary: `Học các chữ Hán tự bài ${lessonNum}`,
            theoryMd: `## Hướng dẫn học chữ Hán Bài ${lessonNum}\n\nHọc cách viết và cách đọc Onyomi/Kunyomi của các chữ Hán tự từ số ${i * cardsPerLesson + 1} đến ${Math.min((i + 1) * cardsPerLesson, kanjiData.length)} trong bài.\nNhấp vào **Thẻ ghi nhớ** để ôn tập và luyện viết nét trực tuyến.`,
            skills: ["KANJI"],
            estimatedMin: 30,
          },
        });

        await prisma.lessonDeck.upsert({
          where: { lessonId_deckId: { lessonId: lesson.id, deckId: kanjiDeck.id } },
          update: {
            role: "KANJI",
            order: 0,
          },
          create: {
            lessonId: lesson.id,
            deckId: kanjiDeck.id,
            role: "KANJI",
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

  console.log('🎉 Hoàn tất seed dữ liệu Hán tự (Kanji)!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed Kanji:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
