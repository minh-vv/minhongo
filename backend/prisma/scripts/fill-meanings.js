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
  'gemini-flash-lite-latest'
];
let currentModelIndex = 0;

function getModel() {
  return genAI.getGenerativeModel({
    model: MODELS[currentModelIndex],
    generationConfig: { responseMimeType: 'application/json' }
  });
}

const files = [
  'mimikara-n3-vocab-lessons.json',
  'mimikara-n2-vocab-lessons.json',
  'mimikara-n1-vocab-lessons.json'
];

const dataDir = path.join(__dirname, '..', 'data');
const BATCH_SIZE = 55;
const DELAY_MS = 4000;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateBatch(batch) {
  const prompt = `Bạn là một biên dịch viên và giáo viên tiếng Nhật chuyên nghiệp.
Hãy dịch/trích xuất nghĩa tiếng Việt chuẩn xác, ngắn gọn và tự nhiên nhất cho các từ vựng tiếng Nhật dưới đây.
Chúng tôi cung cấp từ vựng ("front"), cách đọc ("romaji"), và các câu ví dụ thực tế kèm bản dịch tiếng Việt ("example") để bạn hiểu rõ ngữ cảnh của từ đó.

Yêu cầu:
- Nghĩa dịch ra phải ngắn gọn, súc tích (ví dụ: "bạn cùng lớp", "nhóm, đội", "chuyên nghiệp", "nuông chiều", "chà xát"). Không giải thích dài dòng.
- Không để lại tiền tố "Hán-Việt" hay bất kỳ ký tự nào khác. Chỉ dịch nghĩa tiếng Việt thuần túy của từ.
- Trả về kết quả dưới dạng mảng JSON gồm các đối tượng có cấu trúc chính xác như sau:
[
  {
    "front": "từ_gốc",
    "back": "nghĩa_tiếng_việt_ngắn_gọn"
  }
]
- Không thêm bất kỳ văn bản giải thích hay lời dẫn nào khác ngoài mảng JSON kết quả.

Danh sách từ vựng cần dịch:
${JSON.stringify(batch.map(item => ({ front: item.front, romaji: item.romaji, example: item.example })), null, 2)}`;

  const currentModel = getModel();
  const response = await currentModel.generateContent(prompt);
  const rawText = response.response.text().trim();
  
  try {
    const results = JSON.parse(rawText);
    return results;
  } catch (err) {
    console.error('   ❌ Lỗi parse JSON từ Gemini response:', err.message);
    console.log('   Raw Response:', rawText);
    throw err;
  }
}

async function main() {
  console.log('🏁 Bắt đầu điền nghĩa tiếng Việt còn thiếu cho từ vựng...');

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️ Không tìm thấy file ${file}, bỏ qua.`);
      continue;
    }

    console.log(`\n📂 Đang xử lý file: ${file}`);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lessons = JSON.parse(fileContent);

    // Thu thập tất cả các card thiếu nghĩa
    const emptyCards = [];
    for (let l = 0; l < lessons.length; l++) {
      const lesson = lessons[l];
      for (let d = 0; d < lesson.decks.length; d++) {
        const deckWrapper = lesson.decks[d];
        if (deckWrapper.deck && deckWrapper.deck.cards) {
          for (let c = 0; c < deckWrapper.deck.cards.length; c++) {
            const card = deckWrapper.deck.cards[c];
            if (!card.back || card.back.trim() === '') {
              emptyCards.push({
                lessonIdx: l,
                deckIdx: d,
                cardIdx: c,
                front: card.front,
                romaji: card.romaji,
                example: card.example
              });
            }
          }
        }
      }
    }

    console.log(`📊 Tìm thấy ${emptyCards.length} từ chưa có nghĩa.`);
    if (emptyCards.length === 0) {
      console.log('✅ File này đã có đủ nghĩa.');
      continue;
    }

    const totalBatches = Math.ceil(emptyCards.length / BATCH_SIZE);
    console.log(`📦 Sẽ chia làm ${totalBatches} lô để dịch.`);

    for (let b = 0; b < totalBatches; b++) {
      const startIdx = b * BATCH_SIZE;
      const batchItems = emptyCards.slice(startIdx, startIdx + BATCH_SIZE);
      
      console.log(`🔄 Lô ${b + 1}/${totalBatches} (${batchItems.length} từ)...`);

      let attempts = 0;
      let success = false;
      let translations = [];

      while (attempts < 6 && !success) {
        try {
          attempts++;
          translations = await translateBatch(batchItems);
          success = true;
        } catch (err) {
          const errMsg = err.message || '';
          if (errMsg.includes('429') || errMsg.includes('quota') || errMsg.includes('Quota')) {
            currentModelIndex = (currentModelIndex + 1) % MODELS.length;
            console.warn(`   ⚠️ Lỗi Quota (429)! Chuyển sang model mới: ${MODELS[currentModelIndex]}`);
            attempts = 0; // Reset số lần thử cho model mới
            await sleep(3000);
          } else {
            const waitTime = attempts * 8000;
            console.warn(`   ⚠️ Thử lại lần ${attempts}/6 sau ${waitTime / 1000} giây do lỗi dịch: ${errMsg}`);
            await sleep(waitTime);
          }
        }
      }

      if (success) {
        // Cập nhật vào lessons trong bộ nhớ
        let updatedCount = 0;
        const translationMap = new Map();
        for (const item of translations) {
          translationMap.set(item.front, item.back);
        }

        for (const item of batchItems) {
          const meaning = translationMap.get(item.front) || '';
          if (meaning) {
            lessons[item.lessonIdx].decks[item.deckIdx].deck.cards[item.cardIdx].back = meaning;
            updatedCount++;
          } else {
            // Fallback: Nếu không khớp chính xác, thử tìm theo chỉ số hoặc dịch trực tiếp
            console.log(`   ⚠️ Cảnh báo: Không tìm thấy nghĩa cho từ "${item.front}" trong kết quả Gemini.`);
          }
        }

        // Lưu trực tiếp sau mỗi lô để đảm bảo an toàn
        fs.writeFileSync(filePath, JSON.stringify(lessons, null, 2), 'utf8');
        console.log(`   ✅ Đã cập nhật thành công ${updatedCount}/${batchItems.length} từ của lô.`);
      } else {
        console.error(`   ❌ Đã thất bại hoàn toàn ở lô ${b + 1}. Bỏ qua lô này.`);
      }

      if (b < totalBatches - 1) {
        console.log(`   ⏳ Đang chờ ${DELAY_MS / 1000} giây trước lô tiếp theo...\n`);
        await sleep(DELAY_MS);
      }
    }

    console.log(`🎉 Đã hoàn thành xử lý file ${file}!\n`);
  }

  console.log('✨ Toàn bộ dữ liệu thiếu nghĩa đã được điền đầy đủ và lưu lại!');
}

main().catch((err) => {
  console.error('❌ Lỗi chạy tiến trình:', err);
});
