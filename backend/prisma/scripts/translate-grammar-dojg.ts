import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const DELAY_MS = 2000;
const BATCH_SIZE = 50; // Dịch theo batch nhỏ hơn cho ngữ pháp vì câu dài hơn

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Thiếu GEMINI_API_KEY trong .env');
    return;
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.1-flash-lite',
    generationConfig: { responseMimeType: 'application/json' },
  });

  console.log(`\n🤖 Bắt đầu dịch nghĩa ngữ pháp DOJG (N5/N4) sang tiếng Việt bằng Gemini...`);

  // 1. Lấy tất cả card thuộc 2 deck ngữ pháp DOJG
  const deckIds = ['nguphap-jlpt-n5', 'nguphap-jlpt-n4'];
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
    console.log('⚠️ Không tìm thấy thẻ ngữ pháp nào cần dịch.');
    return;
  }

  console.log(`📊 Tìm thấy tổng cộng ${cards.length} thẻ ngữ pháp.`);

  // 2. Gom nhóm các thẻ trùng để tránh dịch lặp
  const uniqueGroups = new Map<string, { front: string; back: string; ids: string[] }>();
  for (const card of cards) {
    // Chỉ dịch các thẻ có nghĩa tiếng Anh (không chứa ký tự tiếng Việt)
    const isEnglish = /^[a-zA-Z0-9\s,\(\)\-\.\'\!\?\/\\&;~`+*#<>_:|\[\]]+$/.test(card.back);
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
  console.log(`🎯 Số mẫu ngữ pháp độc bản cần dịch tiếng Anh -> tiếng Việt: ${itemsToTranslate.length}`);

  if (itemsToTranslate.length === 0) {
    console.log('✅ Tất cả thẻ ngữ pháp đã có nghĩa tiếng Việt hoặc đã được dịch!');
    return;
  }

  // 3. Phân lô dịch
  const totalBatches = Math.ceil(itemsToTranslate.length / BATCH_SIZE);
  console.log(`📦 Chia thành ${totalBatches} lô (mỗi lô tối đa ${BATCH_SIZE} cấu trúc). Bắt đầu dịch...\n`);

  let successCount = 0;

  for (let b = 0; b < totalBatches; b++) {
    const startIdx = b * BATCH_SIZE;
    const batchItems = itemsToTranslate.slice(startIdx, startIdx + BATCH_SIZE);
    
    console.log(`🔄 Đang dịch lô ${b + 1}/${totalBatches} (${batchItems.length} cấu trúc)...`);

    const payload = batchItems.map((item, idx) => ({
      index: idx,
      concept: item.front,
      english: item.back,
    }));

    const prompt = `Bạn là một từ điển ngữ pháp Nhật - Việt chuyên nghiệp.
Hãy dịch nghĩa/cách dùng của các mẫu ngữ pháp tiếng Nhật từ giải nghĩa tiếng Anh (trường "english") sang tiếng Việt một cách chính xác, tự nhiên, dễ hiểu nhất cho học viên Việt Nam.

Yêu cầu dịch:
- Trả về kết quả dưới dạng một mảng JSON chứa các đối tượng có cấu trúc chính xác như sau: [{"index": số_thứ_tự, "vietnamese": "nghĩa_tiếng_việt"}]
- Trường "vietnamese" phải là nghĩa hoặc định nghĩa ngắn gọn bằng tiếng Việt tương ứng cho cấu trúc đó.
- Không thêm bất kỳ văn bản giải thích hay lời dẫn nào khác ngoài mảng JSON kết quả.

Danh sách cần dịch:
${JSON.stringify(payload, null, 2)}`;

    try {
      const response = await model.generateContent(prompt);
      const rawText = response.response.text().trim();
      
      const results = JSON.parse(rawText) as { index: number; vietnamese: string }[];

      let batchSuccess = 0;
      for (const res of results) {
        const item = batchItems[res.index];
        if (!item || !res.vietnamese) continue;

        const vietnameseMeaning = res.vietnamese.trim();

        // Cập nhật tất cả card trùng mẫu này
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
      console.log(`   ✅ Dịch thành công ${batchSuccess}/${batchItems.length} cấu trúc ngữ pháp trong lô.`);
    } catch (err: any) {
      console.error(`   ❌ Lỗi khi xử lý lô ${b + 1}:`, err.message);
      console.log('   ⏳ Chờ 30s rồi thử lại để vượt qua giới hạn rate limit...');
      b--;
      await new Promise((r) => setTimeout(r, 30000));
      continue;
    }

    if (b < totalBatches - 1) {
      console.log(`   ⏳ Chờ ${DELAY_MS / 1000} giây...\n`);
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  console.log(`\n🎉 Hoàn thành dịch nghĩa ngữ pháp!`);
  console.log(`   ✅ Tổng số mẫu ngữ pháp đã cập nhật giải nghĩa tiếng Việt: ${successCount}.`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
