/**
 * Script: Bổ sung Kanji cho từ vựng N5 chỉ có Hiragana
 * 
 * Nhiều từ N5 trong minna-n5 chỉ ghi bằng Hiragana (vd: せんせい)
 * nhưng thực tế có Kanji tương ứng (先生).
 * Script này dùng Gemini AI để tìm Kanji phù hợp.
 * 
 * Logic:
 * - Chỉ sửa front nếu từ đó có Kanji thông dụng
 * - Giữ nguyên các từ thuần Hiragana (vd: おはよう)
 * - Giữ nguyên Katakana ngoại lai (vd: テニス)
 * - Lưu phiên bản Hiragana gốc vào romaji nếu romaji trùng
 * 
 * Run: node prisma/scripts/fill-kanji-for-vocab.js
 */
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv/config');

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ Không tìm thấy GEMINI_API_KEY trong .env');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
];
let currentModelIndex = 0;

function getModel() {
  return genAI.getGenerativeModel({
    model: MODELS[currentModelIndex],
    generationConfig: { responseMimeType: 'application/json' },
  });
}

const DATA_DIR = path.join(__dirname, '..', 'data');
const FILES_TO_FIX = ['minna-n5-lessons.json', 'minna-n4-lessons.json'];
const BATCH_SIZE = 50;
const DELAY_MS = 3000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf]/;
const HIRAGANA_RE = /[\u3040-\u309f]/;
const KATAKANA_RE = /[\u30a0-\u30ff]/;

async function findKanji(batch) {
  const prompt = `Bạn là giáo viên tiếng Nhật chuyên nghiệp.

Hãy tìm chữ Kanji tương ứng cho các từ vựng Hiragana dưới đây (đây là từ vựng cấp N5/N4).

Quy tắc quan trọng:
- Nếu từ đó có Kanji THÔNG DỤNG ở cấp N5/N4, hãy viết lại dạng Kanji (vd: せんせい → 先生)
- Nếu từ đó viết dạng kết hợp Kanji + Okurigana, ghi đầy đủ (vd: たべます → 食べます)
- Nếu từ KHÔNG CÓ Kanji (vd: おはよう, ありがとう) hoặc thường viết bằng Hiragana, trả về null cho kanji
- Katakana ngoại lai (vd: テニス) → trả về null
- Các trợ từ/hư từ (vd: は, が, を, に...) → trả về null
- Nếu là tổ hợp nhiều từ (vd: あの ひと), chỉ viết Kanji cho phần có Kanji (vd: あの 人)

Trả về mảng JSON:
[
  {
    "front_hira": "từ_hiragana_gốc",
    "kanji": "từ_viết_bằng_kanji" hoặc null nếu không có Kanji phù hợp,
    "reading": "cách_đọc_hiragana"
  }
]

Danh sách từ vựng:
${JSON.stringify(batch.map((item) => ({
  front: item.front,
  romaji: item.romaji,
  back: item.back,
})), null, 2)}`;

  const currentModel = getModel();
  const response = await currentModel.generateContent(prompt);
  const rawText = response.response.text().trim();

  try {
    return JSON.parse(rawText);
  } catch (err) {
    console.error('   ❌ Lỗi parse JSON:', err.message);
    console.log('   Raw:', rawText.substring(0, 200));
    throw err;
  }
}

async function main() {
  console.log('🏁 Bắt đầu bổ sung Kanji cho từ vựng N5/N4...\n');

  for (const file of FILES_TO_FIX) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️ Không tìm thấy file ${file}, bỏ qua.`);
      continue;
    }

    console.log(`📂 Đang xử lý file: ${file}`);
    const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Collect hiragana-only vocab cards
    const cardsToFix = [];
    for (let l = 0; l < lessons.length; l++) {
      for (let d = 0; d < (lessons[l].decks || []).length; d++) {
        const deckWrapper = lessons[l].decks[d];
        if (deckWrapper.role !== 'VOCAB' || !deckWrapper.deck?.cards) continue;

        for (let c = 0; c < deckWrapper.deck.cards.length; c++) {
          const card = deckWrapper.deck.cards[c];
          const front = card.front || '';
          const hasKanji = KANJI_RE.test(front);
          const hasKana = HIRAGANA_RE.test(front) || KATAKANA_RE.test(front);

          if (!hasKanji && hasKana) {
            cardsToFix.push({
              lessonIdx: l,
              deckIdx: d,
              cardIdx: c,
              front: card.front,
              back: card.back,
              romaji: card.romaji,
            });
          }
        }
      }
    }

    console.log(`📊 Tìm thấy ${cardsToFix.length} từ vựng chỉ có Hiragana/Katakana.`);
    if (cardsToFix.length === 0) {
      console.log('✅ File này đã có đủ Kanji.\n');
      continue;
    }

    const totalBatches = Math.ceil(cardsToFix.length / BATCH_SIZE);
    console.log(`📦 Chia thành ${totalBatches} lô.\n`);

    for (let b = 0; b < totalBatches; b++) {
      const startIdx = b * BATCH_SIZE;
      const batchItems = cardsToFix.slice(startIdx, startIdx + BATCH_SIZE);
      console.log(`🔄 Lô ${b + 1}/${totalBatches} (${batchItems.length} từ)...`);

      let attempts = 0;
      let success = false;
      let results = [];

      while (attempts < 6 && !success) {
        try {
          attempts++;
          results = await findKanji(batchItems);
          success = true;
        } catch (err) {
          const errMsg = err.message || '';
          if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Quota') ||
              errMsg.includes('503') || errMsg.includes('demand') || errMsg.includes('Service Unavailable')) {
            currentModelIndex = (currentModelIndex + 1) % MODELS.length;
            console.warn(`   ⚠️ Quota/Service overload! Switching to: ${MODELS[currentModelIndex]}`);
            attempts = 0;
            await sleep(3000);
          } else {
            const waitTime = attempts * 8000;
            console.warn(`   ⚠️ Retry ${attempts}/6 in ${waitTime / 1000}s: ${errMsg}`);
            await sleep(waitTime);
          }
        }
      }

      if (success) {
        let updatedCount = 0;
        let skippedCount = 0;
        const kanjiMap = new Map();
        for (const item of results) {
          kanjiMap.set(item.front_hira, item);
        }

        for (const item of batchItems) {
          const result = kanjiMap.get(item.front);
          if (result && result.kanji) {
            const card = lessons[item.lessonIdx].decks[item.deckIdx].deck.cards[item.cardIdx];
            
            // Store hiragana reading as romaji if not already present
            if (!card.romaji || card.romaji === item.front) {
              card.romaji = result.reading || item.romaji;
            }
            
            // Update front to Kanji form
            card.front = result.kanji;
            updatedCount++;
          } else {
            skippedCount++;
          }
        }

        // Save after each batch
        fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2), 'utf8');
        console.log(`   ✅ Đã thêm Kanji cho ${updatedCount} từ (bỏ qua ${skippedCount} từ không có Kanji).`);
      } else {
        console.error(`   ❌ Thất bại hoàn toàn ở lô ${b + 1}.`);
      }

      if (b < totalBatches - 1) {
        console.log(`   ⏳ Chờ ${DELAY_MS / 1000}s...\n`);
        await sleep(DELAY_MS);
      }
    }

    console.log(`\n🎉 Hoàn tất file ${file}!\n`);
  }

  console.log('✨ Đã bổ sung Kanji cho toàn bộ từ vựng!');
}

main().catch((err) => {
  console.error('❌ Lỗi:', err);
});
