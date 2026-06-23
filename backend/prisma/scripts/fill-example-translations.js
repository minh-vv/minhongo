/**
 * Script: Bổ sung bản dịch tiếng Việt cho câu ví dụ từ vựng
 * 
 * Dùng Gemini AI để dịch câu ví dụ tiếng Nhật sang tiếng Việt.
 * Chỉ xử lý các card có example nhưng thiếu dịch tiếng Việt.
 * 
 * Target: minna-n5-lessons.json, minna-n4-lessons.json
 * 
 * Run: node prisma/scripts/fill-example-translations.js
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
const FILES_TO_FIX = [
  'minna-n5-lessons.json',
  'minna-n4-lessons.json',
];

const BATCH_SIZE = 40;
const DELAY_MS = 3000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function hasVietnamese(text) {
  if (!text) return false;
  return /[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/i.test(text);
}

async function translateExamples(batch) {
  const prompt = `Bạn là giáo viên tiếng Nhật chuyên nghiệp, đang biên soạn giáo trình cho người Việt học tiếng Nhật.

Hãy dịch các câu ví dụ tiếng Nhật sau sang tiếng Việt. Yêu cầu:
- Dịch tự nhiên, chính xác, dễ hiểu cho người học N5/N4
- Giữ nguyên câu tiếng Nhật gốc, thêm bản dịch tiếng Việt ở dòng tiếp theo
- Format output: "câu_tiếng_Nhật\\ndịch_tiếng_Việt" (ngăn cách bằng \\n)
- Nếu câu ví dụ chỉ là 1 từ lẻ (vd: chỉ lặp lại từ vựng), hãy tạo 1 câu ví dụ ngắn kèm dịch

Trả về mảng JSON:
[
  {
    "front": "từ_vựng_gốc",
    "example": "câu_tiếng_Nhật\\ndịch_tiếng_Việt"
  }
]

Danh sách cần dịch:
${JSON.stringify(batch.map((item) => ({
  front: item.front,
  back: item.back,
  romaji: item.romaji,
  example: item.example,
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
  console.log('🏁 Bắt đầu bổ sung bản dịch tiếng Việt cho câu ví dụ...\n');

  for (const file of FILES_TO_FIX) {
    const filePath = path.join(DATA_DIR, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️ Không tìm thấy file ${file}, bỏ qua.`);
      continue;
    }

    console.log(`📂 Đang xử lý file: ${file}`);
    const lessons = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Collect cards that need translation
    const cardsToFix = [];
    for (let l = 0; l < lessons.length; l++) {
      for (let d = 0; d < (lessons[l].decks || []).length; d++) {
        const deckWrapper = lessons[l].decks[d];
        if (deckWrapper.role !== 'VOCAB' || !deckWrapper.deck?.cards) continue;

        for (let c = 0; c < deckWrapper.deck.cards.length; c++) {
          const card = deckWrapper.deck.cards[c];
          // Has example but no Vietnamese translation
          if (card.example && !hasVietnamese(card.example)) {
            cardsToFix.push({
              lessonIdx: l,
              deckIdx: d,
              cardIdx: c,
              front: card.front,
              back: card.back,
              romaji: card.romaji,
              example: card.example,
            });
          }
        }
      }
    }

    console.log(`📊 Tìm thấy ${cardsToFix.length} câu ví dụ cần bổ sung dịch.`);
    if (cardsToFix.length === 0) {
      console.log('✅ File này đã có đủ bản dịch.\n');
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
      let translations = [];

      while (attempts < 6 && !success) {
        try {
          attempts++;
          translations = await translateExamples(batchItems);
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
        const translationMap = new Map();
        for (const item of translations) {
          translationMap.set(item.front, item.example);
        }

        for (const item of batchItems) {
          const newExample = translationMap.get(item.front);
          if (newExample && hasVietnamese(newExample)) {
            lessons[item.lessonIdx].decks[item.deckIdx].deck.cards[item.cardIdx].example = newExample;
            updatedCount++;
          } else {
            console.log(`   ⚠️ Không tìm thấy/không hợp lệ dịch cho "${item.front}"`);
          }
        }

        // Save after each batch
        fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2), 'utf8');
        console.log(`   ✅ Cập nhật ${updatedCount}/${batchItems.length} câu ví dụ.`);
      } else {
        console.error(`   ❌ Thất bại hoàn toàn ở lô ${b + 1}. Bỏ qua.`);
      }

      if (b < totalBatches - 1) {
        console.log(`   ⏳ Chờ ${DELAY_MS / 1000}s...\n`);
        await sleep(DELAY_MS);
      }
    }

    console.log(`\n🎉 Hoàn tất file ${file}!\n`);
  }

  console.log('✨ Đã bổ sung bản dịch tiếng Việt cho toàn bộ câu ví dụ!');
}

main().catch((err) => {
  console.error('❌ Lỗi:', err);
});
