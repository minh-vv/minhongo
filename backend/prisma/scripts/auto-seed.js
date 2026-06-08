/**
 * Auto-seed — Tự động đồng bộ dữ liệu khóa học mỗi khi deploy.
 * 
 * Script này chạy TỰ ĐỘNG mỗi khi container backend khởi động.
 * Sử dụng import-data.js (upsert) nên an toàn chạy nhiều lần —
 * data mới sẽ được cập nhật, data cũ giữ nguyên, không bị trùng lặp.
 * 
 * Dùng: node prisma/scripts/auto-seed.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

async function main() {
  console.log('\n📦 [Auto-Seed] Đồng bộ dữ liệu khóa học vào database...');

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
