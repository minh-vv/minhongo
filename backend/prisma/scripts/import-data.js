const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv/config');

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '..', 'data');

function getDeckId(courseSlug, lessonOrder, deckRole) {
  const roleLower = deckRole.toLowerCase();
  return `${courseSlug}-bai-${lessonOrder}-${roleLower}`;
}

async function main() {
  console.log('\n📥 Bắt đầu import dữ liệu vào database...');

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

  // 2. Import Courses
  console.log('\n--- 3. Import danh sách khóa học (courses.json) ---');
  const coursesFilePath = path.join(DATA_DIR, 'courses.json');
  if (fs.existsSync(coursesFilePath)) {
    const courses = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));
    for (const course of courses) {
      await prisma.course.upsert({
        where: { slug: course.slug },
        update: {
          title: course.title,
          description: course.description,
          jlptLevel: course.jlptLevel,
          textbookRef: course.textbookRef,
          isDefault: course.isDefault,
          isPublic: course.isPublic,
        },
        create: {
          slug: course.slug,
          title: course.title,
          description: course.description,
          jlptLevel: course.jlptLevel,
          textbookRef: course.textbookRef,
          isDefault: course.isDefault,
          isPublic: course.isPublic,
        },
      });
      console.log(`  ✅ Upserted course: ${course.slug}`);
    }
  } else {
    console.log('  ⏭️  courses.json không tìm thấy, bỏ qua');
  }

  // 4. Import Lessons từ các file *-lessons.json
  console.log('\n--- 4. Import bài học và các deck đi kèm ---');
  if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR);
    const lessonsFiles = files.filter(f => f.endsWith('-lessons.json'));

    for (const file of lessonsFiles) {
      const courseSlug = file.replace('-lessons.json', '');
      console.log(`  📦 Đang xử lý các bài học của khóa học: ${courseSlug}...`);
      
      const course = await prisma.course.findUnique({
        where: { slug: courseSlug }
      });

      if (!course) {
        console.warn(`  ⚠️ Cảnh báo: Không tìm thấy course với slug "${courseSlug}". Bỏ qua file ${file}.`);
        continue;
      }

      const lessons = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
      for (const lessonData of lessons) {
        // Upsert Lesson
        const lesson = await prisma.lesson.upsert({
          where: {
            courseId_order: {
              courseId: course.id,
              order: lessonData.order,
            },
          },
          update: {
            title: lessonData.title,
            summary: lessonData.summary,
            theoryMd: lessonData.theoryMd,
            skills: lessonData.skills,
            estimatedMin: lessonData.estimatedMin || 30,
          },
          create: {
            courseId: course.id,
            order: lessonData.order,
            title: lessonData.title,
            summary: lessonData.summary,
            theoryMd: lessonData.theoryMd,
            skills: lessonData.skills,
            estimatedMin: lessonData.estimatedMin || 30,
          },
        });

        let firstDeckId = null;

        // Upsert Decks & Cards trong lesson
        for (const ld of lessonData.decks) {
          const deckId = getDeckId(courseSlug, lessonData.order, ld.role);
          if (!firstDeckId) firstDeckId = deckId;

          // Upsert Deck
          await prisma.deck.upsert({
            where: { id: deckId },
            update: {
              name: ld.deck.name,
              description: ld.deck.description,
              category: ld.deck.category,
              jlptLevel: ld.deck.jlptLevel,
              isPublic: true,
            },
            create: {
              id: deckId,
              name: ld.deck.name,
              description: ld.deck.description,
              category: ld.deck.category,
              jlptLevel: ld.deck.jlptLevel,
              isPublic: true,
              userId: admin.id,
            },
          });

          // Upsert Cards
          const existingCardsCount = await prisma.card.count({ where: { deckId } });
          if (existingCardsCount === ld.deck.cards.length) {
            // Đã có đủ cards, bỏ qua loop
          } else {
            for (let i = 0; i < ld.deck.cards.length; i++) {
              const card = ld.deck.cards[i];
              const cardId = `${deckId}-${i + 1}`;
              await prisma.card.upsert({
                where: { id: cardId },
                update: {
                  front: card.front,
                  back: card.back,
                  romaji: card.romaji,
                  example: card.example,
                  jlptLevel: card.jlptLevel,
                },
                create: {
                  id: cardId,
                  front: card.front,
                  back: card.back,
                  romaji: card.romaji,
                  example: card.example,
                  jlptLevel: card.jlptLevel,
                  deckId: deckId,
                },
              });
            }
          }

          // Connect Lesson ↔ Deck
          await prisma.lessonDeck.upsert({
            where: {
              lessonId_deckId: {
                lessonId: lesson.id,
                deckId: deckId,
              },
            },
            update: {
              role: ld.role,
              order: ld.order,
            },
            create: {
              lessonId: lesson.id,
              deckId: deckId,
              role: ld.role,
              order: ld.order,
            },
          });
        }

        // Setup LessonTest nếu có
        if (lessonData.test && firstDeckId) {
          await prisma.lessonTest.upsert({
            where: { lessonId: lesson.id },
            update: {
              deckId: firstDeckId,
              passScore: lessonData.test.passScore,
              questionCount: lessonData.test.questionCount,
            },
            create: {
              lessonId: lesson.id,
              deckId: firstDeckId,
              passScore: lessonData.test.passScore,
              questionCount: lessonData.test.questionCount,
            },
          });
        }
      }
      console.log(`  ✅ Hoàn tất import ${lessons.length} bài học cho ${courseSlug}`);
    }
  }

  console.log('\n🎉 Đã import toàn bộ dữ liệu thành công!\n');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
