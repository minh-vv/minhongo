/**
 * Script cào từ vựng JLPT N5 từ Jisho.org API
 * và upsert thẳng vào DB qua Prisma.
 *
 * Chạy: ts-node prisma/scripts/crawl-jisho.ts
 *
 * Jisho API docs: https://jisho.org/forum/54fefc1f6e73340b1f160000-is-there-any-kind-of-search-api
 */

import { PrismaClient, DeckCategory } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

// ============================================================
// CONFIG
// ============================================================

// Đọc level từ tham số dòng lệnh: ts-node crawl-jisho.ts 4
const JLPT_LEVEL = parseInt(process.argv[2] ?? '5', 10);
const DECK_OWNER_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@minhongo.com';
const DELAY_MS = 600; // Delay giữa mỗi page để tránh bị rate limit

// ============================================================
// TYPES
// ============================================================

interface JishoWord {
  slug: string;
  is_common: boolean;
  jlpt: string[]; // ["jlpt-n5"]
  japanese: { word?: string; reading: string }[];
  senses: {
    english_definitions: string[];
    parts_of_speech: string[];
    info: string[];
  }[];
}

interface JishoResponse {
  data: JishoWord[];
  meta: { status: number };
}

interface VocabEntry {
  front: string;   // Chữ Nhật (kanji nếu có, fallback reading)
  reading: string; // Hiragana/katakana
  back: string;    // Nghĩa tiếng Anh (bạn có thể dịch sang tiếng Việt sau)
  romaji: string;  // Placeholder — Jisho không trả romaji, dùng reading
  example: string;
}

// ============================================================
// HELPERS
// ============================================================

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function wordToFront(w: JishoWord): string {
  const j = w.japanese[0];
  return j?.word ?? j?.reading ?? w.slug;
}

function wordToReading(w: JishoWord): string {
  return w.japanese[0]?.reading ?? '';
}

function wordToBack(w: JishoWord): string {
  // Lấy nghĩa đầu tiên của sense đầu tiên
  return w.senses[0]?.english_definitions.slice(0, 3).join(', ') ?? '';
}

function wordToExample(w: JishoWord): string {
  const front = wordToFront(w);
  const reading = wordToReading(w);
  if (reading && reading !== front) {
    return `${front}（${reading}）`;
  }
  return front;
}

// ============================================================
// JISHO FETCH
// ============================================================

async function fetchPage(level: number, page: number): Promise<JishoWord[]> {
  const url = `https://jisho.org/api/v1/search/words?keyword=%23jlpt-n${level}&page=${page}`;
  console.log(`  → Fetching page ${page}: ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Jisho API error: ${res.status} ${res.statusText}`);
  }

  const json = (await res.json()) as JishoResponse;
  return json.data ?? [];
}

async function fetchAllWords(level: number): Promise<VocabEntry[]> {
  const results: VocabEntry[] = [];
  let page = 1;

  console.log(`\n📥 Bắt đầu cào từ vựng JLPT N${level} từ Jisho...`);

  while (true) {
    const words = await fetchPage(level, page);

    if (words.length === 0) {
      console.log(`  ✅ Hết data tại page ${page}. Tổng: ${results.length} từ.`);
      break;
    }

    for (const w of words) {
      // Chỉ lấy từ thực sự là N-level đó
      const isLevel = w.jlpt.includes(`jlpt-n${level}`);
      if (!isLevel) continue;

      results.push({
        front: wordToFront(w),
        reading: wordToReading(w),
        back: wordToBack(w),
        romaji: wordToReading(w), // Reading làm romaji tạm
        example: wordToExample(w),
      });
    }

    console.log(`  Page ${page}: lấy được ${words.length} từ, tổng ${results.length}`);
    page++;
    await sleep(DELAY_MS);
  }

  return results;
}

// ============================================================
// UPSERT VÀO DB
// ============================================================

async function upsertVocabToDB(level: number, vocab: VocabEntry[]) {
  console.log(`\n💾 Đang upsert vào DB...`);

  // Lấy user admin để gán làm owner của deck
  const owner = await prisma.user.findUnique({
    where: { email: DECK_OWNER_EMAIL },
  });

  if (!owner) {
    throw new Error(
      `Không tìm thấy user "${DECK_OWNER_EMAIL}". Hãy chạy seed trước: npm run seed`,
    );
  }

  // Tạo/cập nhật deck chứa toàn bộ từ vựng N{level}
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
      category: DeckCategory.TUVUNG,
      jlptLevel: level,
      userId: owner.id,
    },
  });

  console.log(`  ✅ Deck: "${deck.name}" (${deck.id})`);

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
      console.warn(`  ⚠️  Bỏ qua card "${v.front}":`, err);
      skipped++;
    }

    // Log tiến độ mỗi 50 card
    if ((i + 1) % 50 === 0 || i + 1 === vocab.length) {
      console.log(`  Progress: ${i + 1}/${vocab.length} cards`);
    }
  }

  console.log(`\n🎉 Xong! Upserted ${created} cards, bỏ qua ${skipped} cards.`);
  console.log(`   Deck ID: ${deck.id}`);
  console.log(`   Dùng deck ID này để gắn vào Lesson trong Admin UI hoặc seed.`);
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
  console.error('❌ Lỗi:', e);
  process.exit(1);
});
