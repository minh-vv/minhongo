/**
 * Script cào từ vựng JLPT từ Jisho.org API
 * và upsert thẳng vào DB qua Prisma.
 *
 * Chạy trong Docker: docker exec minhongo-backend-1 node prisma/scripts/crawl-jisho.js
 * Chạy local:        node prisma/scripts/crawl-jisho.js
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv/config');

const prisma = new PrismaClient();

// ============================================================
// CONFIG — đổi JLPT_LEVEL để cào level khác (4, 3, 2, 1)
// ============================================================

const JLPT_LEVEL = 5;
const DECK_OWNER_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@minhongo.com';
const DELAY_MS = 500; // Delay giữa page để tránh rate limit

// ============================================================
// HELPERS
// ============================================================

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function wordToFront(w) {
  const j = w.japanese[0];
  return (j?.word ?? j?.reading ?? w.slug) || w.slug;
}

function wordToReading(w) {
  return w.japanese[0]?.reading ?? '';
}

function wordToBack(w) {
  return w.senses[0]?.english_definitions.slice(0, 3).join(', ') ?? '';
}

function wordToExample(w) {
  const front = wordToFront(w);
  const reading = wordToReading(w);
  if (reading && reading !== front) {
    return `${front}（${reading}）`;
  }
  return front;
}

// ============================================================
// FETCH TỪ JISHO
// ============================================================

async function fetchPage(level, page) {
  const url = `https://jisho.org/api/v1/search/words?keyword=%23jlpt-n${level}&page=${page}`;
  console.log(`  → Page ${page}: ${url}`);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Jisho API error: ${res.status}`);

  const json = await res.json();
  return json.data ?? [];
}

async function fetchAllWords(level) {
  const results = [];
  let page = 1;

  console.log(`\n📥 Cào từ vựng JLPT N${level} từ Jisho...`);

  while (true) {
    const words = await fetchPage(level, page);

    if (words.length === 0) {
      console.log(`  ✅ Hết data tại page ${page}. Tổng: ${results.length} từ.`);
      break;
    }

    for (const w of words) {
      if (!w.jlpt.includes(`jlpt-n${level}`)) continue;

      const front = wordToFront(w);
      const back = wordToBack(w);
      if (!front || !back) continue; // Bỏ qua từ thiếu dữ liệu

      results.push({
        front,
        reading: wordToReading(w),
        back,
        romaji: wordToReading(w),
        example: wordToExample(w),
      });
    }

    console.log(`  Page ${page}: tổng ${results.length} từ`);
    page++;
    await sleep(DELAY_MS);
  }

  return results;
}

// ============================================================
// UPSERT VÀO DB
// ============================================================

async function upsertVocabToDB(level, vocab) {
  console.log(`\n💾 Kết nối DB và upsert ${vocab.length} từ...`);

  const owner = await prisma.user.findUnique({
    where: { email: DECK_OWNER_EMAIL },
  });

  if (!owner) {
    throw new Error(
      `Không tìm thấy user "${DECK_OWNER_EMAIL}".\nChạy seed trước: npm run seed`,
    );
  }

  console.log(`  ✅ Owner: ${owner.email}`);

  // Tạo/cập nhật deck
  const deckId = `jisho-tuvung-jlpt-n${level}`;
  const deck = await prisma.deck.upsert({
    where: { id: deckId },
    update: {
      name: `[Jisho] Từ vựng N${level} (${vocab.length} từ)`,
      description: `Toàn bộ từ vựng JLPT N${level} cào từ Jisho.org`,
    },
    create: {
      id: deckId,
      name: `[Jisho] Từ vựng N${level} (${vocab.length} từ)`,
      description: `Toàn bộ từ vựng JLPT N${level} cào từ Jisho.org`,
      isPublic: true,
      category: 'TUVUNG',
      jlptLevel: level,
      userId: owner.id,
    },
  });

  console.log(`  ✅ Deck: "${deck.name}"`);

  // Upsert từng card
  let created = 0;
  let skipped = 0;

  for (let i = 0; i < vocab.length; i++) {
    const v = vocab[i];
    const cardId = `${deckId}-${i + 1}`;

    try {
      await prisma.card.upsert({
        where: { id: cardId },
        update: {
          front: v.front,
          back: v.back,
          romaji: v.romaji,
          example: v.example,
          jlptLevel: level,
        },
        create: {
          id: cardId,
          front: v.front,
          back: v.back,
          romaji: v.romaji,
          example: v.example,
          jlptLevel: level,
          deckId: deck.id,
        },
      });
      created++;
    } catch (err) {
      console.warn(`  ⚠️  Bỏ qua "${v.front}": ${err.message}`);
      skipped++;
    }

    if ((i + 1) % 100 === 0 || i + 1 === vocab.length) {
      console.log(`  Progress: ${i + 1}/${vocab.length} cards`);
    }
  }

  console.log(`\n🎉 Xong!`);
  console.log(`   ✅ Upserted: ${created} cards`);
  console.log(`   ⚠️  Bỏ qua:  ${skipped} cards`);
  console.log(`   📦 Deck ID: ${deck.id}`);
  console.log(`\n   👉 Dùng Deck ID trên để gắn vào Lesson trong Admin UI.`);
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  try {
    const vocab = await fetchAllWords(JLPT_LEVEL);

    if (vocab.length === 0) {
      console.error('❌ Không lấy được từ vựng nào. Kiểm tra kết nối mạng.');
      return;
    }

    await upsertVocabToDB(JLPT_LEVEL, vocab);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('❌ Lỗi:', e.message);
  process.exit(1);
});
