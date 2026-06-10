/**
 * Auto-seed — Tự động đồng bộ dữ liệu khóa học khi database trống.
 * 
 * Script này chạy mỗi khi container backend khởi động, nhưng CHỈ seed
 * khi database chưa có dữ liệu khóa học (course.count === 0).
 * Nếu database đã có dữ liệu, script sẽ bỏ qua để tiết kiệm thời gian.
 * 
 * Để force re-seed: node prisma/scripts/import-data.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');

async function main() {
  console.log('\n📦 [Auto-Seed] Kiểm tra dữ liệu khóa học...');

  const prisma = new PrismaClient();
  let needsSync = false;
  try {
    const courseCount = await prisma.course.count();
    const lessonCount = await prisma.lesson.count();
    const jishoCount = await prisma.deck.count({
      where: { id: { startsWith: 'jisho-' } }
    });

    if (courseCount >= 8 && lessonCount >= 437 && jishoCount === 0) {
      console.log(`  ✅ Database đã được đồng bộ đầy đủ (${courseCount} khóa học, ${lessonCount} bài học, 0 jisho). Bỏ qua seed.`);
      console.log('  💡 Để force re-seed: node prisma/scripts/import-data.js\n');
      return;
    }

    needsSync = true;
    console.log(`  ⚠️ Dữ liệu chưa đồng bộ đủ hoặc thừa Jisho:`);
    console.log(`    - Số khóa học hiện tại: ${courseCount} / 8`);
    console.log(`    - Số bài học hiện tại: ${lessonCount} / 437`);
    console.log(`    - Số lượng deck Jisho dư thừa: ${jishoCount}`);
    console.log('  ⚙️ Bắt đầu dọn dẹp Jisho và đồng bộ dữ liệu chuẩn...');
  } catch (err) {
    console.error('   ❌ Lỗi khi kiểm tra DB:', err.message);
    needsSync = true;
  } finally {
    await prisma.$disconnect();
  }

  if (!needsSync) return;

  const cleanScript = path.join(__dirname, 'clean-jisho.js');
  const importScript = path.join(__dirname, 'import-data.js');

  try {
    if (fs.existsSync(cleanScript)) {
      console.log('   🧹 Đang chạy clean-jisho.js...');
      execSync(`node "${cleanScript}"`, {
        stdio: 'inherit',
        env: process.env,
      });
    }

    if (fs.existsSync(importScript)) {
      console.log('   📥 Đang chạy import-data.js...');
      execSync(`node "${importScript}"`, {
        stdio: 'inherit',
        env: process.env,
      });
    }
    console.log('\n   🎉 [Auto-Seed] Đồng bộ và dọn dẹp dữ liệu hoàn tất!');
  } catch (err) {
    console.error('   ❌ [Auto-Seed] Lỗi khi đồng bộ:', err.message);
    console.error('   ⚠️  Server sẽ tiếp tục khởi động bình thường.');
  }
}

main();

