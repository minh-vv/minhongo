/**
 * Script dùng Gemini AI generate theoryMd cho các bài học của khóa học được chọn.
 *
 * Chạy: npm run generate:theory [slug-khóa-học]
 * Ví dụ: npm run generate:theory minna-n5
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
// PROMPT — lấy bài 1 làm ví dụ định dạng gồm Ngữ pháp, Đọc hiểu và Nghe hiểu
// ============================================================

const FORMAT_EXAMPLE = `# Bài 1 — Tự giới thiệu

## 📖 Lý thuyết Ngữ pháp

### 1. Mẫu câu cơ bản: \`N1 は N2 です\`
**Cấu trúc:** \`Chủ ngữ は Bổ ngữ です\`
- \`は\` (đọc là **wa**) là trợ từ đánh dấu chủ đề.
- \`です\` (desu) đứng cuối câu, mang nghĩa "là" (lịch sự).

#### Ví dụ
- わたしは マイク です。 → *Tôi là Mike.*

### 2. Câu phủ định: \`N1 は N2 じゃ ありません\`
Thay \`です\` bằng \`じゃ ありません\`.
- わたしは がくsei じゃ ありません。 → *Tôi không phải học sinh.*

### 3. Câu hỏi: \`〜ですか\`
Thêm \`か\` vào cuối câu.
- あなたは マイクさん ですか。 → *Bạn có phải là Mike không?*

## 📖 Luyện Đọc Hiểu (読解 - Dokkai)
Hãy đọc đoạn văn ngắn dưới đây (áp dụng các từ vựng và ngữ pháp của bài học) và trả lời câu hỏi:

**Đoạn văn:**
わたしはマイクです。アメリカじんのオフィスワーカーです。やまださんはにほんじんです。せんせいです。

*Phiên âm (Romaji):*
Watashi wa Maiku desu. Amerika-jin no ofisuwākā desu. Yamada-san wa Nihon-jin desu. Sensei desu.

*Bản dịch tiếng Việt:*
Tôi là Mike. Tôi là nhân viên văn phòng người Mỹ. Anh Yamada là người Nhật. Anh ấy là giáo viên.

**Câu hỏi trắc nghiệm:**
やまださんはアメリカじんのオフィスワーカーですか。
(Anh Yamada có phải là nhân viên văn phòng người Mỹ không?)

**Các phương án:**
1. はい、そうです。(Vâng, đúng vậy)
2. いいえ、そうじゃありません。せんせいです。(Không, không phải vậy. Anh ấy là giáo viên)
3. はい、せんせいです。(Vâng, anh ấy là giáo viên)
4. いいえ, アメリカじんです。(Không, anh ấy là người Mỹ)

*Đáp án đúng:* **2**
*Giải thích chi tiết:* Trong đoạn văn ghi rõ "やまださんはにほんじんです。せんせいです" (Anh Yamada là người Nhật. Anh ấy là giáo viên), do đó anh Yamada không phải là nhân viên văn phòng người Mỹ.

## 🎧 Luyện Nghe Hiểu (聴解 - Choukai)
Đọc kịch bản hội thoại luyện nghe dưới đây (áp dụng các từ vựng và ngữ pháp của bài học) và trả lời câu hỏi:

**Kịch bản hội thoại:**
A: はじめまして。わたしはマイクです。がくseいです。どうぞよろしく。
B: はじめまして。たなかです。わたしもがくseいです。どうぞよろしく。

*Bản dịch tiếng Việt:*
A: Lần đầu gặp mặt. Tôi là Mike. Tôi là học sinh. Rất mong được giúp đỡ.
B: Lần đầu gặp mặt. Tôi là Tanaka. Tôi cũng là học sinh. Rất mong được giúp đỡ.

**Câu hỏi trắc nghiệm:**
AさんとBさんはなんですか。
(Anh A và anh B làm nghề gì?)

**Các phương án:**
1. せんせい (Giáo viên)
2. ぎんこういん (Nhân viên ngân hàng)
3. がくせい (Học sinh)
4. かいしゃいん (Nhân viên văn phòng)

*Đáp án đúng:* **3**
*Giải thích chi tiết:* Cả A và B đều tự giới thiệu bản thân là "がくせい" (học sinh).

---
**Sau bài này bạn sẽ làm được:** giới thiệu tên, nghề nghiệp, quốc tịch; hiểu và làm bài tập đọc hiểu & nghe hội thoại cơ bản.`;

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

Hãy viết phần bài giảng lý thuyết đầy đủ (theoryMd) cho **${lessonTitle}** bao gồm cả Ngữ pháp, bài tập Đọc hiểu (Dokkai) và kịch bản luyện Nghe hiểu (Choukai) theo đúng định dạng markdown ví dụ bên dưới.

**Yêu cầu nghiêm ngặt:**
- Viết hoàn toàn bằng **tiếng Việt** (trừ các từ/câu tiếng Nhật)
- Giải thích **2-4 điểm ngữ pháp** chính của bài
- Cung cấp **1 phần Đọc hiểu (Dokkai)**: Gồm đoạn văn tiếng Nhật ngắn dùng từ vựng/ngữ pháp của bài, phiên âm Romaji, bản dịch tiếng Việt, 1 câu hỏi trắc nghiệm 4 đáp án và đáp án đúng kèm giải thích chi tiết.
- Cung cấp **1 phần Nghe hiểu (Choukai)**: Gồm kịch bản hội thoại ngắn dùng từ vựng/ngữ pháp của bài, bản dịch tiếng Việt, 1 câu hỏi trắc nghiệm 4 đáp án và đáp án đúng kèm giải thích chi tiết.
- Cuối bài có dòng tổng kết "**Sau bài này bạn sẽ làm được:** ..."
- Không sao chép từ sách Minna no Nihongo, tự biên soạn lại sinh động và thực tế
- Tổng độ dài: 500-800 từ để đảm bảo đầy đủ chất lượng.

**Tóm tắt bài:** ${lessonSummary}

**Một số từ vựng trong bài:**
${vocabList}

**Ví dụ định dạng mẫu chuẩn** (Bài 1 mẫu để tham khảo cấu trúc chính xác):
${FORMAT_EXAMPLE}

---
Bây giờ hãy viết bài giảng theoryMd đầy đủ chất lượng cao cho **${lessonTitle}**. Chỉ trả về nội dung markdown chính xác, không thêm giải thích hay lời dẫn ngoài.`;
}

// ============================================================
// MAIN
// ============================================================

// Lấy tham số dòng lệnh cho Slug khóa học (mặc định là minna-n5)
const COURSE_SLUG = process.argv[2] ?? 'minna-n5';

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Lỗi: Thiếu GEMINI_API_KEY trong file .env\n');
    process.exitCode = 1;
    return;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

    // Lấy khóa học được yêu cầu
    const course = await prisma.course.findUnique({ where: { slug: COURSE_SLUG } });
    if (!course) {
      console.error(`❌ Lỗi: Khóa học "${COURSE_SLUG}" không tồn tại trong Cơ sở dữ liệu.\n`);
      
      // Liệt kê các khóa học đang tồn tại để người dùng dễ chọn lựa
      const allCourses = await prisma.course.findMany({
        select: { slug: true, title: true, jlptLevel: true },
        orderBy: { jlptLevel: 'desc' },
      });
      
      console.log('💡 DANH SÁCH CÁC KHÓA HỌC SẴN CÓ:');
      allCourses.forEach((c) => {
        console.log(`  - ${c.slug.padEnd(12)} : ${c.title} (N${c.jlptLevel})`);
      });
      console.log('\n👉 Vui lòng chạy lại bằng cách truyền tham số slug chính xác.');
      console.log('Ví dụ: npm run generate:theory minna-n4\n');
      process.exitCode = 1;
      return;
    }

    console.log(`\n============================================================`);
    console.log(`🤖 TIẾN TRÌNH: SINH LÝ THUYẾT NGỮ PHÁP (Gemini 3.5 Flash)`);
    console.log(`   Khóa học: ${course.title} (${course.slug})`);
    console.log(`============================================================`);

    // Lấy tất cả các bài học liên kết
    const allLessons = await prisma.lesson.findMany({
      where: { courseId: course.id },
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

    // Lọc ra các bài học chưa có lý thuyết thực tế (hoặc là placeholder, hoặc thiếu phần Đọc hiểu mới)
    // Đối với N5, chúng ta chỉ sinh lý thuyết từ bài 6 trở đi (bài 1-5 đã có dữ liệu seed cố định)
    const lessonsToProcess = allLessons.filter((lesson) => {
      if (course.slug === 'minna-n5' && lesson.order < 6) return false;
      
      const isPlaceholder =
        !lesson.theoryMd ||
        lesson.theoryMd.includes('đang được biên soạn') ||
        lesson.theoryMd.includes('Placeholder') ||
        lesson.theoryMd.length < 350 ||
        !lesson.theoryMd.includes('Luyện Đọc Hiểu'); // Thêm điều kiện này để nâng cấp các bài N5 cũ
        
      return isPlaceholder;
    });

    if (lessonsToProcess.length === 0) {
      console.log(`\n🎉 Tuyệt vời! Tất cả các bài học trong khóa học "${course.title}" đã được sinh lý thuyết đầy đủ.`);
      console.log(`   → Không có bài học nào sử dụng Placeholder cần xử lý.`);
      return;
    }

    console.log(`\n📊 Tìm thấy ${allLessons.length} bài học tổng cộng.`);
    console.log(`   👉 Phát hiện ${lessonsToProcess.length} bài học sử dụng Placeholder cần sinh lý thuyết ngữ pháp.\n`);

    let success = 0;
    let failed = 0;

    for (let idx = 0; idx < lessonsToProcess.length; idx++) {
      const lesson = lessonsToProcess[idx];
      console.log(`📖 [${idx + 1}/${lessonsToProcess.length}] Bài ${lesson.order}: ${lesson.title}`);

      // Lấy sample vocab từ deck đầu tiên để đưa vào ngữ cảnh Prompt
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

        const preview = cleaned.split('\n')[0]; // Dòng đầu tiên làm tiêu đề xem thử
        console.log(`   ✅ Thành công — Trích dẫn: "${preview}"`);
        success++;
      } catch (err: any) {
        console.error(`   ❌ Lỗi sinh nội dung: ${err.message}`);
        console.log('   ⏳ Đang chờ 30 giây rồi thử lại để vượt qua giới hạn rate limit...');
        idx--; // Giảm chỉ số để chạy lại bài này
        await sleep(30000);
        continue;
      }

      // Delay giữa các request để tránh rate limit của Gemini API
      if (idx < lessonsToProcess.length - 1) {
        console.log(`   ⏳ Chờ ${DELAY_MS / 1000}s để gọi API tiếp theo...\n`);
        await sleep(DELAY_MS);
      }
    }

    console.log(`\n============================================================`);
    console.log(`🎉 HOÀN THÀNH TIẾN TRÌNH CHO KHÓA HỌC: ${course.title}`);
    console.log(`   ✅ Thành công: ${success} bài`);
    console.log(`   ❌ Thất bại:  ${failed} bài`);
    console.log(`============================================================\n`);
    
    if (failed > 0) {
      console.log(`💡 Gợi ý: Hãy chạy lại script để tự động tiếp tục (resume) xử lý các bài bị lỗi.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error('❌ Lỗi tiến trình:', e.message);
    process.exitCode = 1;
  });
