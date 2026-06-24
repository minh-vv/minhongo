import * as fs from 'fs';
import * as path from 'path';

const DATA_DIR = path.join(__dirname, '..', 'data');

async function main() {
  console.log('🔄 Bắt đầu cập nhật tên bài học từ vựng cho N5, N4, N3...');

  // 1. Cập nhật N5 (Minna no Nihongo I)
  const n5Path = path.join(DATA_DIR, 'minna-n5-lessons.json');
  if (fs.existsSync(n5Path)) {
    console.log(`Reading N5: ${n5Path}`);
    const n5Data = JSON.parse(fs.readFileSync(n5Path, 'utf8'));
    for (const lesson of n5Data) {
      for (const d of lesson.decks) {
        if (d.role === 'VOCAB') {
          d.deck.name = `Minna N5 — Bài ${lesson.order}`;
          console.log(`   N5 - Bài ${lesson.order} Vocab -> "${d.deck.name}"`);
        }
      }
    }
    fs.writeFileSync(n5Path, JSON.stringify(n5Data, null, 2), 'utf8');
    console.log('✅ Cập nhật file N5 hoàn tất.');
  }

  // 2. Cập nhật N4 (Minna no Nihongo II)
  const n4Path = path.join(DATA_DIR, 'minna-n4-lessons.json');
  if (fs.existsSync(n4Path)) {
    console.log(`Reading N4: ${n4Path}`);
    const n4Data = JSON.parse(fs.readFileSync(n4Path, 'utf8'));
    for (const lesson of n4Data) {
      const lessonNumber = lesson.order + 25;
      // Cập nhật vocab deck name
      for (const d of lesson.decks) {
        if (d.role === 'VOCAB') {
          d.deck.name = `Minna N4 — Bài ${lessonNumber}`;
          console.log(`   N4 - Bài ${lessonNumber} Vocab -> "${d.deck.name}"`);
        }
      }
    }
    fs.writeFileSync(n4Path, JSON.stringify(n4Data, null, 2), 'utf8');
    console.log('✅ Cập nhật file N4 hoàn tất.');
  }

  // 3. Cập nhật N3 (Mimikara Oboeru N3)
  const n3Path = path.join(DATA_DIR, 'mimikara-n3-vocab-lessons.json');
  if (fs.existsSync(n3Path)) {
    console.log(`Reading N3: ${n3Path}`);
    const n3Data = JSON.parse(fs.readFileSync(n3Path, 'utf8'));
    for (const lesson of n3Data) {
      // Tách tên bài học từ title (Ví dụ: "Bài 1: Danh từ" -> "Danh từ")
      const titleParts = lesson.title.split(':');
      if (titleParts.length >= 2) {
        const lessonName = titleParts.slice(1).join(':').trim();
        for (const d of lesson.decks) {
          if (d.role === 'VOCAB') {
            d.deck.name = `Mimikara N3 — Bài ${lesson.order}: ${lessonName}`;
            console.log(`   N3 - Bài ${lesson.order} Vocab -> "${d.deck.name}"`);
          }
        }
      }
    }
    fs.writeFileSync(n3Path, JSON.stringify(n3Data, null, 2), 'utf8');
    console.log('✅ Cập nhật file N3 hoàn tất.');
  }

  console.log('🎉 Đã hoàn tất xử lý tất cả các file JSON!');
}

main().catch(err => {
  console.error('❌ Lỗi:', err);
});
