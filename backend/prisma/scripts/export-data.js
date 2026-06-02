/**
 * Export toàn bộ data khóa học từ DB local ra JSON files.
 * Chạy: node prisma/scripts/export-data.js
 * 
 * Output: prisma/data/jisho-n5.json, courses.json, lessons.json, ...
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv/config');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '..', 'data');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function writeJSON(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`  ✅ ${filename} — ${Array.isArray(data) ? data.length + ' items' : 'object'}`);
}

async function main() {
  ensureDir(DATA_DIR);
  console.log(`\n📦 Exporting data to ${DATA_DIR}\n`);

  // 1. Export Jisho vocab decks (N5, N4, N3, N2, N1)
  for (const level of [5, 4, 3, 2, 1]) {
    const deckId = `jisho-tuvung-jlpt-n${level}`;
    const cards = await prisma.card.findMany({
      where: { deckId },
      orderBy: { createdAt: 'asc' },
      select: { front: true, back: true, romaji: true, example: true, jlptLevel: true },
    });

    if (cards.length > 0) {
      writeJSON(`jisho-n${level}.json`, cards);
    } else {
      console.log(`  ⏭️  jisho-n${level}.json — no data, skipping`);
    }
  }

  // 2. Export courses
  const courses = await prisma.course.findMany({
    orderBy: { jlptLevel: 'desc' },
    select: {
      slug: true,
      title: true,
      description: true,
      jlptLevel: true,
      textbookRef: true,
      isDefault: true,
      isPublic: true,
    },
  });
  writeJSON('courses.json', courses);

  // 3. Export lessons with their decks and tests
  for (const course of courses) {
    const fullCourse = await prisma.course.findUnique({
      where: { slug: course.slug },
    });

    const lessons = await prisma.lesson.findMany({
      where: { courseId: fullCourse.id },
      orderBy: { order: 'asc' },
      include: {
        decks: {
          include: {
            deck: {
              include: {
                cards: {
                  orderBy: { createdAt: 'asc' },
                  select: { front: true, back: true, romaji: true, example: true, jlptLevel: true },
                },
              },
            },
          },
        },
        test: true,
      },
    });

    const exportedLessons = lessons.map((lesson) => ({
      order: lesson.order,
      title: lesson.title,
      summary: lesson.summary,
      theoryMd: lesson.theoryMd,
      skills: lesson.skills,
      estimatedMin: lesson.estimatedMin,
      decks: lesson.decks.map((ld) => ({
        role: ld.role,
        order: ld.order,
        deck: {
          name: ld.deck.name,
          description: ld.deck.description,
          category: ld.deck.category,
          jlptLevel: ld.deck.jlptLevel,
          cards: ld.deck.cards,
        },
      })),
      test: lesson.test
        ? { passScore: lesson.test.passScore, questionCount: lesson.test.questionCount }
        : null,
    }));

    writeJSON(`${course.slug}-lessons.json`, exportedLessons);
  }

  console.log('\n🎉 Export hoàn tất!\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
