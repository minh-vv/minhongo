/**
 * Script dịch nghĩa từ vựng tiếng Anh sang tiếng Việt sử dụng Gemini 3.5 Flash.
 *
 * Chạy: npm run translate [5|4|3|2|1|all]
 * Ví dụ: npm run translate 5 (chỉ dịch các từ N5)
 *
 * Yêu cầu: GEMINI_API_KEY trong .env
 */

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Delay giữa các lô request để tránh rate limit
const DELAY_MS = 2000;
const BATCH_SIZE = 150;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Định nghĩa tham số dòng lệnh
const LEVEL_ARG = process.argv[2] ?? '5'; // Mặc định dịch level 5

async function main() {
  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: { responseMimeType: 'application/json' },
  });

  console.log(`\n🤖 Đang phân tích dữ liệu cần dịch cho cấp độ: JLPT N${LEVEL_ARG}...\n`);

  // 1. Xác định các bộ Deck cần xử lý
  let deckIds: string[] = [];
  if (LEVEL_ARG === 'all') {
    deckIds = [
      'jisho-tuvung-jlpt-n5',
      'jisho-tuvung-jlpt-n4',
      'jisho-tuvung-jlpt-n3',
      'jisho-tuvung-jlpt-n2',
      'jisho-tuvung-jlpt-n1',
      ...Array.from({ length: 20 }, (_, i) => `minna-n5-bai-${i + 6}-vocab`),
    ];
  } else {
    const level = parseInt(LEVEL_ARG, 10);
    if (isNaN(level) || level < 1 || level > 5) {
      throw new Error('Tham số cấp độ không hợp lệ. Vui lòng nhập từ 1 đến 5 hoặc "all".');
    }
    deckIds = [`jisho-tuvung-jlpt-n${level}`];
    
    // Nếu là N5, dịch luôn các từ trong bài học Minna N5 6-25 để đồng bộ
    if (level === 5) {
      deckIds.push(...Array.from({ length: 20 }, (_, i) => `minna-n5-bai-${i + 6}-vocab`));
    }
  }

  // 2. Lấy tất cả card thuộc các deck này
  const cards = await prisma.card.findMany({
    where: {
      deckId: { in: deckIds },
    },
    select: {
      id: true,
      front: true,
      back: true,
    },
  });

  if (cards.length === 0) {
    console.log('⚠️ Không tìm thấy thẻ từ vựng nào cần dịch trong các Deck đã chọn.');
    return;
  }

  console.log(`📊 Tìm thấy tổng cộng ${cards.length} thẻ từ vựng.`);

  // 3. Gom nhóm các thẻ trùng nhau (trùng cả front và back) để tránh dịch lặp
  const uniqueGroups = new Map<string, { front: string; back: string; ids: string[] }>();
  for (const card of cards) {
    // Chỉ dịch các thẻ có nghĩa tiếng Anh (không chứa ký tự tiếng Việt có dấu)
    const isEnglish = /^[a-zA-Z0-9\s,\(\)\-\.\'\!\?\/\\&;]+$/.test(card.back);
    if (!isEnglish) {
      continue;
    }

    const key = `${card.front.trim()}|||${card.back.trim()}`;
    if (!uniqueGroups.has(key)) {
      uniqueGroups.set(key, {
        front: card.front.trim(),
        back: card.back.trim(),
        ids: [],
      });
    }
    uniqueGroups.get(key)!.ids.push(card.id);
  }

  const itemsToTranslate = Array.from(uniqueGroups.values());
  console.log(`🎯 Số từ vựng độc bản (unique) cần dịch tiếng Anh -> tiếng Việt: ${itemsToTranslate.length}`);

  if (itemsToTranslate.length === 0) {
    console.log('✅ Tất cả từ vựng trong các bộ Deck này đã có nghĩa tiếng Việt hoặc đã được dịch trước đó!');
    return;
  }

  // 4. Phân lô dịch bằng Gemini
  const totalBatches = Math.ceil(itemsToTranslate.length / BATCH_SIZE);
  console.log(`📦 Chia thành ${totalBatches} lô (mỗi lô tối đa ${BATCH_SIZE} từ). Bắt đầu dịch...\n`);

  let successCount = 0;

  for (let b = 0; b < totalBatches; b++) {
    const startIdx = b * BATCH_SIZE;
    const batchItems = itemsToTranslate.slice(startIdx, startIdx + BATCH_SIZE);
    
    console.log(`🔄 Đang dịch lô ${b + 1}/${totalBatches} (${batchItems.length} từ)...`);

    // Tạo danh sách gửi lên Gemini
    const payload = batchItems.map((item, idx) => ({
      index: idx,
      kanji: item.front,
      english: item.back,
    }));

    const prompt = `Bạn là một từ điển Nhật - Việt chuyên nghiệp.
Hãy dịch nghĩa của các từ vựng tiếng Nhật từ tiếng Anh (trường "english") sang nghĩa tiếng Việt chính xác, tự nhiên, ngắn gọn và thông dụng nhất.

Yêu cầu dịch:
- Trả về kết quả dưới dạng một mảng JSON chứa các đối tượng có cấu trúc chính xác như sau: [{"index": số_thứ_tự, "vietnamese": "nghĩa_tiếng_việt"}]
- Trường "vietnamese" phải là nghĩa tiếng Việt dịch từ "english".
- Không thêm bất kỳ văn bản giải thích hay lời dẫn nào khác ngoài mảng JSON kết quả.

Danh sách cần dịch:
${JSON.stringify(payload, null, 2)}`;

    try {
      const response = await model.generateContent(prompt);
      const rawText = response.response.text().trim();
      
      const results = JSON.parse(rawText) as { index: number; vietnamese: string }[];

      // Thực hiện cập nhật DB hàng loạt cho lô này
      let batchSuccess = 0;
      for (const res of results) {
        const item = batchItems[res.index];
        if (!item || !res.vietnamese) continue;

        const vietnameseMeaning = res.vietnamese.trim();

        // Cập nhật tất cả các card có front + back khớp với từ vựng này
        await prisma.card.updateMany({
          where: {
            id: { in: item.ids },
          },
          data: {
            back: vietnameseMeaning,
          },
        });
        batchSuccess++;
      }

      successCount += batchSuccess;
      console.log(`   ✅ Dịch thành công ${batchSuccess}/${batchItems.length} từ trong lô.`);
    } catch (err: any) {
      console.error(`   ❌ Lỗi khi xử lý lô ${b + 1}:`, err.message);
      console.log('   ⏳ Sẽ thử lại sau...');
      // Giảm chỉ số b để chạy lại lô này
      b--;
      await sleep(5000);
      continue;
    }

    // Delay giữa các lô để tránh bị rate limit
    if (b < totalBatches - 1) {
      console.log(`   ⏳ Chờ ${DELAY_MS / 1000} giây...\n`);
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n🎉 Hoàn thành dịch nghĩa!`);
  console.log(`   ✅ Tổng số từ đã dịch và cập nhật tiếng Việt thành công: ${successCount} từ.`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi tiến trình:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
