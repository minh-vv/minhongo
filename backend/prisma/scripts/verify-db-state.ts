import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('📊 KIỂM TRA TRẠNG THÁI CƠ SỞ DỮ LIỆU...');

  const courseCount = await prisma.course.count();
  const lessonCount = await prisma.lesson.count();
  const deckCount = await prisma.deck.count();
  const cardCount = await prisma.card.count();
  const testCount = await prisma.lessonTest.count();
  const progressCount = await prisma.cardProgress.count();

  console.log(`\n📈 TỔNG QUAN:`);
  console.log(`- Khóa học (Courses): ${courseCount}`);
  console.log(`- Bài học (Lessons): ${lessonCount}`);
  console.log(`- Bộ thẻ (Decks): ${deckCount}`);
  console.log(`- Thẻ học (Cards): ${cardCount}`);
  console.log(`- Bài kiểm tra (Lesson Tests): ${testCount}`);
  console.log(`- Tiến độ ôn tập (Card Progress): ${progressCount}`);

  console.log(`\n📚 CHI TIẾT CÁC KHÓA HỌC HIỆN CÓ:`);
  const courses = await prisma.course.findMany({
    orderBy: { jlptLevel: 'desc' },
    include: {
      _count: {
        select: { lessons: true }
      }
    }
  });

  for (const c of courses) {
    console.log(`\n- [N${c.jlptLevel}] ${c.title} (slug: ${c.slug})`);
    console.log(`  * Số bài học: ${c._count.lessons}`);
    
    // Get total cards in this course
    const lessons = await prisma.lesson.findMany({
      where: { courseId: c.id },
      include: {
        decks: {
          include: {
            deck: {
              include: {
                _count: { select: { cards: true } }
              }
            }
          }
        }
      }
    });

    let totalCards = 0;
    for (const l of lessons) {
      for (const d of l.decks) {
        totalCards += d.deck._count.cards;
      }
    }
    console.log(`  * Tổng số thẻ học: ${totalCards}`);
  }

  // Ensure no general Jisho cards are left
  const jishoCards = await prisma.card.count({
    where: { deckId: { startsWith: 'jisho-' } }
  });
  console.log(`\n🔍 KIỂM TRA BẤT THƯỜNG:`);
  console.log(`- Thẻ thuộc deck Jisho (yêu cầu = 0): ${jishoCards}`);

  if (jishoCards === 0) {
    console.log('✅ Hợp lệ: Không có thẻ Jisho thừa nào trong database.');
  } else {
    console.log('❌ Cảnh báo: Vẫn còn thẻ Jisho thừa trong database!');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
