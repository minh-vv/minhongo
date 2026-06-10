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
  try {
    const courseCount = await prisma.course.count();
    if (courseCount > 0) {
      console.log(`  ✅ Database đã có ${courseCount} khóa học. Bỏ qua seed.`);
      console.log('  💡 Để force re-seed: node prisma/scripts/import-data.js\n');
      return;
    }

    console.log('  📭 Database trống. Bắt đầu seed dữ liệu...');
  } finally {
    await prisma.$disconnect();
  }

  const importScript = path.join(__dirname, 'import-data.js');

  if (!fs.existsSync(importScript)) {
    console.error('   ❌ Không tìm thấy import-data.js! Bỏ qua seed.');
    return;
  }

  try {
    execSync(`node "${importScript}"`, {
      stdio: 'inherit',
      env: process.env,
    });
    console.log('\n   🎉 [Auto-Seed] Đồng bộ dữ liệu hoàn tất!');
  } catch (err) {
    console.error('   ❌ [Auto-Seed] Lỗi khi import:', err.message);
    // Không exit(1) — cho server vẫn khởi động được dù seed lỗi
    console.error('   ⚠️  Server sẽ tiếp tục khởi động bình thường.');
  }
}

main();

