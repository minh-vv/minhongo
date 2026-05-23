/**
 * Script dùng Gemini AI generate theoryMd cho lesson 6-25 của course Minna N5.
 *
 * Chạy: npm run generate:theory
 *
 * Yêu cầu: GEMINI_API_KEY trong .env
 */

import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Delay để tránh rate limit Gemini
const DELAY_MS = 3000;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ============================================================
// PROMPT — lấy bài 1 làm ví dụ định dạng
// ============================================================

const FORMAT_EXAMPLE = `# Bài 1 — Tự giới thiệu

## 1. Mẫu câu cơ bản: \`N1 は N2 です\`

**Cấu trúc:** \`Chủ ngữ は Bổ ngữ です\`

- \`は\` (đọc là **wa**) là trợ từ đánh dấu chủ đề.
- \`です\` (desu) đứng cuối câu, mang nghĩa "là" (lịch sự).

### Ví dụ

- わたしは マイク です。 → *Tôi là Mike.*

## 2. Câu phủ định: \`じゃ ありません\`

Thay \`です\` bằng \`じゃ ありません\`.

- わたしは がくせい じゃ ありません。 → *Tôi không phải học sinh.*

## 3. Câu hỏi: \`〜ですか\`

Thêm \`か\` vào cuối câu.

- あなたは マイクさん ですか。 → *Bạn có phải là Mike không?*

---
**Sau bài này bạn sẽ làm được:** giới thiệu tên, nghề nghiệp, quốc tịch.`;

function buildPrompt(
  lessonOrder: number,
  lessonTitle: string,
  lessonSummary: string,
  vocabSample: { front: string; back: string; romaji: string }[],
): string {
  const vocabList = vocabSample
    .slice(0, 15)
    .map((v) => `- ${v.front} (${v.romaji}): ${v.back}`)
    .join('\n');

  return `Bạn là giáo viên tiếng Nhật viết tài liệu học cho người Việt Nam.

Hãy viết phần lý thuyết (theoryMd) cho **${lessonTitle}** theo đúng định dạng markdown bên dưới.

**Yêu cầu:**
- Viết hoàn toàn bằng **tiếng Việt** (trừ các từ/câu tiếng Nhật)
- Giải thích **2-4 điểm ngữ pháp** chính của bài, mỗi điểm có:
  - Cấu trúc trong code block
  - Ít nhất 2 ví dụ tiếng Nhật kèm phiên âm và nghĩa tiếng Việt
  - Lưu ý quan trọng nếu có
- Cuối bài có dòng tổng kết "**Sau bài này bạn sẽ làm được:** ..."
- Không sao chép từ sách Minna no Nihongo, tự biên soạn lại
- Độ dài: 300-500 từ

**Tóm tắt bài:** ${lessonSummary}

**Một số từ vựng trong bài:**
${vocabList}

**Ví dụ định dạng** (bài 1 để tham khảo cấu trúc):
${FORMAT_EXAMPLE}

---
Bây giờ hãy viết theoryMd cho **${lessonTitle}**. Chỉ trả về nội dung markdown, không thêm giải thích hay lời dẫn.`;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

  // Lấy course minna-n5
  const course = await prisma.course.findUnique({ where: { slug: 'minna-n5' } });
  if (!course) throw new Error('Course "minna-n5" không tồn tại. Chạy npm run seed trước.');

  // Lấy các lesson cần generate (order 6-25, theoryMd là placeholder)
  const lessons = await prisma.lesson.findMany({
    where: {
      courseId: course.id,
      order: { gte: 6 },
    },
    orderBy: { order: 'asc' },
    include: {
      decks: {
        include: {
          deck: {
            include: {
              cards: { take: 20, orderBy: { createdAt: 'asc' } },
            },
          },
        },
      },
    },
  });

  console.log(`\n🤖 Bắt đầu generate theory cho ${lessons.length} bài (6-25)...\n`);

  let success = 0;
  let failed = 0;

  for (const lesson of lessons) {
    console.log(`📖 Bài ${lesson.order}: ${lesson.title}`);

    // Lấy sample vocab từ deck đầu tiên
    const vocabSample =
      lesson.decks[0]?.deck.cards.map((c) => ({
        front: c.front,
        back: c.back,
        romaji: c.romaji ?? '',
      })) ?? [];

    const prompt = buildPrompt(
      lesson.order,
      lesson.title,
      lesson.summary ?? '',
      vocabSample,
    );

    try {
      const result = await model.generateContent(prompt);
      const theoryMd = result.response.text().trim();

      // Xóa code fence nếu Gemini bọc trong ```markdown ... ```
      const cleaned = theoryMd
        .replace(/^```(?:markdown)?\n?/i, '')
        .replace(/\n?```$/i, '')
        .trim();

      await prisma.lesson.update({
        where: { id: lesson.id },
        data: { theoryMd: cleaned },
      });

      const preview = cleaned.split('\n')[0]; // dòng đầu
      console.log(`   ✅ OK — "${preview}"`);
      success++;
    } catch (err: any) {
      console.error(`   ❌ Lỗi: ${err.message}`);
      failed++;
    }

    // Delay giữa các request
    if (lesson.order < lessons[lessons.length - 1].order) {
      console.log(`   ⏳ Chờ ${DELAY_MS / 1000}s...\n`);
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n🎉 Hoàn thành!`);
  console.log(`   ✅ Thành công: ${success} bài`);
  console.log(`   ❌ Thất bại:  ${failed} bài`);
  if (failed > 0) {
    console.log(`   → Chạy lại script để retry các bài thất bại.`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
