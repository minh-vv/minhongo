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
    // 0. Dọn dẹp khóa học trùng lặp từ script cũ (shinkansen-n2-bunpou) nếu tồn tại
    const duplicateCourse = await prisma.course.findUnique({
      where: { slug: 'shinkansen-n2-bunpou' }
    });
    if (duplicateCourse) {
      console.log('  🧹 [Cleanup] Phát hiện khóa học dư thừa shinkansen-n2-bunpou. Tiến hành dọn dẹp...');
      
      // Xóa khóa học -> cascade xóa Lessons, LessonDecks, LessonTests, v.v.
      await prisma.course.delete({
        where: { id: duplicateCourse.id }
      });
      console.log('  ✅ [Cleanup] Đã xóa khóa học shinkansen-n2-bunpou.');
      
      // Xóa các bộ thẻ dư thừa bắt đầu bằng 'shinkansen-n2-bai-'
      const deletedDecks = await prisma.deck.deleteMany({
        where: { id: { startsWith: 'shinkansen-n2-bai-' } }
      });
      console.log(`  ✅ [Cleanup] Đã xóa ${deletedDecks.count} bộ thẻ dư thừa.`);
    }

    const courseCount = await prisma.course.count();
    const lessonCount = await prisma.lesson.count();
    const jishoCount = await prisma.deck.count({
      where: { id: { startsWith: 'jisho-' } }
    });

    if (courseCount >= 8 && lessonCount >= 437 && jishoCount === 0) {
      console.log(`  ✅ Database đã được đồng bộ đầy đủ (${courseCount} khóa học, ${lessonCount} bài học, 0 jisho). Bỏ qua full seed.`);
      
      // Tuy nhiên, vẫn đồng bộ lại phần example/back của Card ngữ pháp
      // phòng trường hợp data JSON đã thay đổi nhưng DB chưa cập nhật
      const syncScript = path.join(__dirname, 'sync-grammar-examples.js');
      if (fs.existsSync(syncScript)) {
        console.log('  🔄 Đang đồng bộ dữ liệu ví dụ ngữ pháp...');
        try {
          execSync(`node "${syncScript}" --apply`, {
            stdio: 'inherit',
            env: process.env,
          });
        } catch (syncErr) {
          console.warn('  ⚠️ Lỗi đồng bộ ví dụ ngữ pháp (không ảnh hưởng server):', syncErr.message);
        }
      }

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

