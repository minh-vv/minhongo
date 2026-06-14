/**
 * sync-grammar-examples.js
 * 
 * Đồng bộ trường "example" và "back" của các Card ngữ pháp trên production
 * từ các file JSON data (minna-n5-lessons.json, shinkanzen-n2-grammar-lessons.json, v.v.)
 * 
 * Script này AN TOÀN cho production:
 * - Chỉ UPDATE các Card đã tồn tại (không xóa/tạo mới)
 * - Chỉ cập nhật field example, back khi khác với giá trị cũ
 * - Có dry-run mode để kiểm tra trước
 * 
 * Usage:
 *   node prisma/scripts/sync-grammar-examples.js              # dry-run (xem diff)
 *   node prisma/scripts/sync-grammar-examples.js --apply      # thực sự cập nhật
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
require('dotenv/config');

const prisma = new PrismaClient();
const DATA_DIR = path.join(__dirname, '..', 'data');
const DRY_RUN = !process.argv.includes('--apply');

// Map: file name → course slug
const LESSON_FILES = [
  { file: 'minna-n5-lessons.json',                  slug: 'minna-n5' },
  { file: 'minna-n4-lessons.json',                  slug: 'minna-n4' },
  { file: 'shinkanzen-n3-grammar-lessons.json',      slug: 'shinkanzen-n3-grammar' },
  { file: 'shinkanzen-n2-grammar-lessons.json',      slug: 'shinkanzen-n2-grammar' },
  { file: 'shinkanzen-n1-grammar-lessons.json',      slug: 'shinkanzen-n1-grammar' },
];

function getDeckId(courseSlug, lessonOrder, deckRole) {
  const roleLower = deckRole.toLowerCase();
  return `${courseSlug}-bai-${lessonOrder}-${roleLower}`;
}

function truncate(str, len = 60) {
  if (!str) return '(empty)';
  const s = str.replace(/\n/g, '\\n');
  return s.length > len ? s.substring(0, len) + '...' : s;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  📝 Sync Grammar Card Examples ${DRY_RUN ? '(DRY RUN)' : '(APPLYING)'}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (DRY_RUN) {
    console.log('💡 Chạy ở chế độ DRY RUN — chỉ xem thay đổi, không ghi DB.');
    console.log('   Để thực sự cập nhật: node prisma/scripts/sync-grammar-examples.js --apply\n');
  }

  let totalChecked = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalNotFound = 0;

  for (const { file, slug } of LESSON_FILES) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Bỏ qua ${file} — file không tồn tại.`);
      continue;
    }

    console.log(`\n📦 Processing: ${file} (${slug})`);
    const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    for (const lesson of lessons) {
      for (const ld of (lesson.decks || [])) {
        // Only process GRAMMAR decks
        if (ld.role !== 'GRAMMAR' && ld.deck?.category !== 'NGUPHAP') continue;

        const deckId = getDeckId(slug, lesson.order, ld.role);
        const cards = ld.deck?.cards || [];

        for (let i = 0; i < cards.length; i++) {
          const cardId = `${deckId}-${i + 1}`;
          const newExample = cards[i].example || '';
          const newBack = cards[i].back || '';
          totalChecked++;

          // Fetch current card from DB
          const existingCard = await prisma.card.findUnique({
            where: { id: cardId },
            select: { id: true, front: true, example: true, back: true },
          });

          if (!existingCard) {
            totalNotFound++;
            continue;
          }

          const needsUpdate =
            (existingCard.example || '') !== newExample ||
            (existingCard.back || '') !== newBack;

          if (!needsUpdate) {
            totalSkipped++;
            continue;
          }

          // Show diff
          if ((existingCard.example || '') !== newExample) {
            console.log(`  📝 ${cardId} [${existingCard.front}]`);
            console.log(`     example OLD: ${truncate(existingCard.example, 80)}`);
            console.log(`     example NEW: ${truncate(newExample, 80)}`);
          }
          if ((existingCard.back || '') !== newBack) {
            console.log(`  📝 ${cardId} [${existingCard.front}]`);
            console.log(`     back OLD: ${truncate(existingCard.back, 80)}`);
            console.log(`     back NEW: ${truncate(newBack, 80)}`);
          }

          if (!DRY_RUN) {
            await prisma.card.update({
              where: { id: cardId },
              data: { example: newExample, back: newBack },
            });
          }

          totalUpdated++;
        }
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`  📊 Tổng kết:`);
  console.log(`     Checked:   ${totalChecked} cards`);
  console.log(`     Updated:   ${totalUpdated} cards ${DRY_RUN ? '(would update)' : '(updated)'}`);
  console.log(`     Unchanged: ${totalSkipped} cards`);
  console.log(`     Not found: ${totalNotFound} cards`);
  console.log('═══════════════════════════════════════════════════════════');

  if (DRY_RUN && totalUpdated > 0) {
    console.log('\n💡 Chạy lại với --apply để cập nhật thực sự:');
    console.log('   node prisma/scripts/sync-grammar-examples.js --apply');
  }
}

main()
  .catch((err) => {
    console.error('❌ Lỗi:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
