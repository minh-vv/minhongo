import { PrismaClient, DeckCategory, LessonDeckRole, SkillType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '..', 'data');

function getDeckId(courseSlug: string, lessonOrder: number, deckRole: string): string {
  const roleLower = deckRole.toLowerCase();
  return `${courseSlug}-bai-${lessonOrder}-${roleLower}`;
}

async function main() {
  console.log('\n🧹 Bắt đầu dọn dẹp cơ sở dữ liệu để chuẩn hóa...');

  // 1. Clear existing database in dependency order
  try {
    await prisma.lessonTest.deleteMany({});
    await prisma.lessonDeck.deleteMany({});
    await prisma.userLessonProgress.deleteMany({});
    await prisma.userCourseProgress.deleteMany({});
    await prisma.customRoadmapItem.deleteMany({});
    await prisma.customRoadmapPhase.deleteMany({});
    await prisma.customRoadmap.deleteMany({});
    await prisma.cardProgress.deleteMany({});
    await prisma.reviewLog.deleteMany({});
    await prisma.card.deleteMany({});
    await prisma.deck.deleteMany({});
    await prisma.lesson.deleteMany({});
    await prisma.course.deleteMany({});
    console.log('✅ Đã xóa sạch các bảng cũ thành công.');
  } catch (err: any) {
    console.error('❌ Lỗi khi dọn dẹp DB:', err.message);
    process.exit(1);
  }

  // 2. Ensure admin account exists
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@minhongo.com';
  let admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  
  if (!admin) {
    console.log(`➕ Tạo tài khoản admin mặc định: ${adminEmail}`);
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
    console.log(`✅ Sử dụng tài khoản admin hiện tại: ${admin.email}`);
  }

  // 3. Import Courses
  console.log('\n--- 3. Import danh sách khóa học chuẩn (courses.json) ---');
  const coursesFilePath = path.join(DATA_DIR, 'courses.json');
  if (!fs.existsSync(coursesFilePath)) {
    console.error('❌ Không tìm thấy courses.json!');
    process.exit(1);
  }

  const courses = JSON.parse(fs.readFileSync(coursesFilePath, 'utf8'));
  for (const c of courses) {
    await prisma.course.create({
      data: {
        slug: c.slug,
        title: c.title,
        description: c.description,
        jlptLevel: c.jlptLevel,
        textbookRef: c.textbookRef,
        isDefault: c.isDefault,
        isPublic: c.isPublic,
      },
    });
    console.log(`  ✅ Đã import course: ${c.slug}`);
  }

  // 4. Import Lessons for each Course
  console.log('\n--- 4. Import bài học và bộ thẻ chi tiết ---');
  const lessonFiles = [
    'minna-n5-lessons.json',
    'minna-n4-lessons.json',
    'mimikara-n3-vocab-lessons.json',
    'shinkanzen-n3-grammar-lessons.json',
    'mimikara-n2-vocab-lessons.json',
    'shinkanzen-n2-grammar-lessons.json',
    'mimikara-n1-vocab-lessons.json',
    'shinkanzen-n1-grammar-lessons.json',
  ];

  for (const file of lessonFiles) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ Warning: Bỏ qua ${file} vì không tìm thấy file!`);
      continue;
    }

    const courseSlug = file.replace('-lessons.json', '');
    console.log(`📦 Đang xử lý bài học của: ${courseSlug}...`);
    
    const course = await prisma.course.findUnique({
      where: { slug: courseSlug }
    });

    if (!course) {
      console.warn(`⚠️ Cảnh báo: Không tìm thấy course trong DB với slug "${courseSlug}". Bỏ qua.`);
      continue;
    }

    const lessonsData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    for (const lessonData of lessonsData) {
      // Create Lesson
      const lesson = await prisma.lesson.create({
        data: {
          courseId: course.id,
          order: lessonData.order,
          title: lessonData.title,
          summary: lessonData.summary,
          theoryMd: lessonData.theoryMd,
          skills: lessonData.skills as SkillType[],
          estimatedMin: lessonData.estimatedMin || 30,
        },
      });

      let firstDeckId: string | null = null;

      // Create Decks & Cards inside lesson
      for (const ld of lessonData.decks) {
        const deckId = getDeckId(courseSlug, lessonData.order, ld.role);
        if (!firstDeckId) firstDeckId = deckId;

        // Create Deck
        await prisma.deck.create({
          data: {
            id: deckId,
            name: ld.deck.name,
            description: ld.deck.description,
            category: ld.deck.category as DeckCategory,
            jlptLevel: ld.deck.jlptLevel,
            isPublic: true,
            userId: admin.id,
          },
        });

        // Create Cards inside Deck
        for (let i = 0; i < ld.deck.cards.length; i++) {
          const card = ld.deck.cards[i];
          const cardId = `${deckId}-${i + 1}`;
          await prisma.card.create({
            data: {
              id: cardId,
              front: card.front,
              back: card.back,
              romaji: card.romaji ?? '',
              example: card.example ?? '',
              jlptLevel: card.jlptLevel,
              deckId: deckId,
            },
          });
        }

        // Connect Lesson ↔ Deck
        await prisma.lessonDeck.create({
          data: {
            lessonId: lesson.id,
            deckId: deckId,
            role: ld.role as LessonDeckRole,
            order: ld.order ?? 0,
          },
        });
      }

      // Create LessonTest if specified
      if (lessonData.test && firstDeckId) {
        await prisma.lessonTest.create({
          data: {
            lessonId: lesson.id,
            deckId: firstDeckId,
            passScore: lessonData.test.passScore || 70,
            questionCount: lessonData.test.questionCount || 10,
          },
        });
      }
    }
    console.log(`  ✅ Đã import thành công ${lessonsData.length} bài học cho ${courseSlug}`);
  }

  console.log('\n🎉 Quá trình chuẩn hóa và seed cơ sở dữ liệu đã hoàn tất thành công!');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
