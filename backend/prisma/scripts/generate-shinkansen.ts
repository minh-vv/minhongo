import { PrismaClient } from '@prisma/client';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const prisma = new PrismaClient();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const DELAY_MS = 4000; // 4 seconds delay between API calls

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Clean markdown wrapper from JSON output
function cleanJson(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  return cleaned.trim();
}

// Call Gemini API with automatic retry on 429/503 errors
async function generateWithRetry(model: any, parts: any[], maxRetries = 4): Promise<string> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (error: any) {
      attempt++;
      console.warn(`⚠️ [Gemini API] Lần thử thứ ${attempt} thất bại: ${error.message || error}`);
      if (attempt >= maxRetries) {
        throw error;
      }
      const waitTime = attempt * 15000;
      console.log(`Đợi ${waitTime / 1000} giây trước khi thử lại...`);
      await sleep(waitTime);
    }
  }
  throw new Error('Thất bại sau nhiều lần thử lại');
}

async function run() {
  const tocPath = path.join(__dirname, 'shinkansen-toc.json');
  const pdfPath = path.join(__dirname, '../../../filenguon/Shinkanzen Master N2 Bunpou (tiếng Việt).pdf');
  const cacheDir = path.join(__dirname, 'shinkansen-lessons');

  if (!fs.existsSync(tocPath) || !fs.existsSync(pdfPath)) {
    console.error('Không tìm thấy file shinkansen-toc.json hoặc file PDF!');
    process.exit(1);
  }

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    console.log(`Đã tạo thư mục cache tại: ${cacheDir}`);
  }

  // Load Table of Contents
  const toc = JSON.parse(fs.readFileSync(tocPath, 'utf8'));
  console.log(`Đã nạp danh sách gồm ${toc.length} bài học cần trích xuất.`);

  // Load PDF base64 once
  console.log('Đang nạp file PDF...');
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64Pdf = pdfBuffer.toString('base64');
  console.log('Đã nạp file PDF xong.');

  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  // 1. Tạo/Cập nhật Course Shinkanzen N2
  console.log('--- 1. Thiết lập khóa học trong DB ---');
  const course = await prisma.course.upsert({
    where: { slug: 'shinkansen-n2-bunpou' },
    update: {
      title: 'Shinkanzen Master N2 — Ngữ pháp',
      description: 'Khóa học ôn luyện ngữ pháp JLPT N2 bám sát giáo trình Shinkanzen Master bản dịch tiếng Việt.',
      isPublic: true,
    },
    create: {
      slug: 'shinkansen-n2-bunpou',
      title: 'Shinkanzen Master N2 — Ngữ pháp',
      description: 'Khóa học ôn luyện ngữ pháp JLPT N2 bám sát giáo trình Shinkanzen Master bản dịch tiếng Việt.',
      jlptLevel: 2,
      textbookRef: 'Shinkanzen Master N2',
      isDefault: false,
      isPublic: true
    }
  });
  console.log(`Đã thiết lập khóa học: ${course.title} (ID: ${course.id})`);

  // Lấy admin user để làm owner của deck
  const admin = await prisma.user.findFirst({ where: { isAdmin: true } });
  if (!admin) {
    console.error('Không tìm thấy tài khoản admin trong hệ thống. Vui lòng chạy npm run seed trước!');
    process.exit(1);
  }
  console.log(`Sử dụng tài khoản admin: ${admin.email} làm chủ sở hữu bộ thẻ.`);

  // 2. Trích xuất chi tiết từng bài học thông qua Gemini
  console.log('\n--- 2. Bắt đầu trích xuất chi tiết bài học từ PDF ---');
  
  for (const item of toc) {
    const cacheFile = path.join(cacheDir, `lesson-${item.order}.json`);
    let lessonData: { theoryMd: string; cards: any[] };

    if (fs.existsSync(cacheFile)) {
      console.log(`[Cache] Bài ${item.order} đã có sẵn trong cache. Đang nạp...`);
      try {
        lessonData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      } catch (err) {
        console.error(`Lỗi đọc file cache bài ${item.order}, tiến hành trích xuất lại.`);
        fs.unlinkSync(cacheFile);
        continue;
      }
    } else {
      console.log(`[Gemini] Đang trích xuất Bài ${item.order}: ${item.title}...`);
      
      const prompt = `
Bạn là trợ lý giảng dạy tiếng Nhật chuyên nghiệp.
Đây là file PDF sách ngữ pháp "Shinkanzen Master N2 Bunpou" dịch tiếng Việt.
Hãy phân tích tài liệu này và trích xuất nội dung CHI TIẾT của bài học sau đây:
Bài: ${item.order}
Tiêu đề: "${item.title}"

Yêu cầu trích xuất toàn bộ các điểm ngữ pháp có trong bài học này từ cuốn sách. Với mỗi điểm ngữ pháp, hãy cung cấp thông tin chi tiết bằng tiếng Việt bao gồm: ý nghĩa, cấu trúc kết hợp, và các câu ví dụ tiếng Nhật đi kèm dịch nghĩa.

Hãy định dạng câu trả lời của bạn thành một chuỗi JSON thô (không có các thẻ markdown \`\`\`json) theo đúng cấu trúc sau:
{
  "theoryMd": "# ${item.title}\\n\\n## 📖 Lý thuyết Ngữ pháp\\n\\n### 1. [Tên ngữ pháp 1]\\n- **Ý nghĩa:** [Nghĩa tiếng Việt]\\n- **Cách kết hợp:** [Công thức cấu trúc]\\n- **Giải thích:** [Cách dùng chi tiết bằng tiếng Việt]\\n\\n#### Ví dụ:\\n- [Câu ví dụ 1 tiếng Nhật] → *[Dịch nghĩa tiếng Việt]*\\n- [Câu ví dụ 2 tiếng Nhật] → *[Dịch nghĩa tiếng Việt]*\\n\\n### 2. [Tên ngữ pháp 2]... (lặp lại cho tất cả ngữ pháp của bài)",
  "cards": [
    {
      "front": "Cấu trúc ngữ pháp tiếng Nhật (ví dụ: 〜に際して)",
      "back": "Ý nghĩa tiếng Việt và cách sử dụng tóm tắt (ví dụ: Khi..., nhân dịp...)",
      "romaji": "Phiên âm Romaji (ví dụ: ni saishite)",
      "example": "Câu ví dụ tiếng Nhật tiêu biểu kèm dịch nghĩa tiếng Việt trong ngoặc. Ví dụ: お申し込みに際しては、写真が必要となります。(Khi đăng ký, cần phải có ảnh.)"
    }
  ]
}

Chú ý:
- Chỉ trả về chuỗi JSON thô, không chứa bất kỳ giải thích nào bên ngoài.
- Hãy trích xuất trung thực và chính xác các ví dụ thực tế trong tài liệu.
- Đảm bảo "theoryMd" là nội dung bài giảng chi tiết, định dạng Markdown rõ ràng, dễ đọc.
- Đảm bảo "cards" chứa đầy đủ các điểm ngữ pháp để làm flashcard học tập.
`;

      try {
        const rawResponse = await generateWithRetry(model, [
          {
            inlineData: {
              data: base64Pdf,
              mimeType: 'application/pdf'
            }
          },
          prompt
        ]);

        const cleaned = cleanJson(rawResponse);
        lessonData = JSON.parse(cleaned);

        // Save to cache
        fs.writeFileSync(cacheFile, JSON.stringify(lessonData, null, 2));
        console.log(`[Cache] Đã lưu cache bài ${item.order} thành công.`);
        
        // Delay to avoid rate limit
        await sleep(DELAY_MS);
      } catch (err: any) {
        console.error(`❌ Không thể trích xuất Bài ${item.order}:`, err.message || err);
        console.log('Dừng tiến trình để sửa lỗi.');
        process.exit(1);
      }
    }

    // 3. Thực thi Seeding vào DB
    console.log(`[DB] Đang seed Bài ${item.order} vào PostgreSQL...`);
    
    // A. Upsert Lesson
    const lesson = await prisma.lesson.upsert({
      where: {
        courseId_order: {
          courseId: course.id,
          order: item.order
        }
      },
      update: {
        title: item.title,
        summary: item.description,
        theoryMd: lessonData.theoryMd,
        skills: ['GRAMMAR']
      },
      create: {
        courseId: course.id,
        order: item.order,
        title: item.title,
        summary: item.description,
        theoryMd: lessonData.theoryMd,
        skills: ['GRAMMAR']
      }
    });

    // B. Upsert Deck
    const deckSlug = `shinkansen-n2-bai-${item.order}-grammar`;
    const deck = await prisma.deck.upsert({
      where: { id: deckSlug },
      update: {
        name: `Shinkanzen N2 — Bài ${item.order} — Ngữ pháp`,
        description: `Bộ thẻ ngữ pháp cho: ${item.title}`,
        jlptLevel: 2,
        category: 'NGUPHAP',
        isPublic: true,
      },
      create: {
        id: deckSlug,
        name: `Shinkanzen N2 — Bài ${item.order} — Ngữ pháp`,
        description: `Bộ thẻ ngữ pháp cho: ${item.title}`,
        jlptLevel: 2,
        category: 'NGUPHAP',
        isPublic: true,
        userId: admin.id
      }
    });

    // C. Re-create Cards (Xóa cũ tạo mới cho sạch)
    await prisma.card.deleteMany({ where: { deckId: deck.id } });
    for (const card of lessonData.cards) {
      await prisma.card.create({
        data: {
          deckId: deck.id,
          front: card.front,
          back: card.back,
          romaji: card.romaji,
          example: card.example,
          jlptLevel: 2
        }
      });
    }

    // D. Connect Lesson & Deck
    await prisma.lessonDeck.upsert({
      where: {
        lessonId_deckId: {
          lessonId: lesson.id,
          deckId: deck.id
        }
      },
      update: {
        role: 'GRAMMAR',
        order: 1
      },
      create: {
        lessonId: lesson.id,
        deckId: deck.id,
        role: 'GRAMMAR',
        order: 1
      }
    });

    // E. Setup LessonTest (Quiz mở khóa bài)
    await prisma.lessonTest.upsert({
      where: { lessonId: lesson.id },
      update: {
        deckId: deck.id,
        passScore: 70,
        questionCount: Math.min(lessonData.cards.length, 10)
      },
      create: {
        lessonId: lesson.id,
        deckId: deck.id,
        passScore: 70,
        questionCount: Math.min(lessonData.cards.length, 10)
      }
    });

    console.log(`✅ Seed thành công Bài ${item.order}! (Đã tạo ${lessonData.cards.length} thẻ ngữ pháp)`);
  }

  console.log('\n======================================================');
  console.log('🎉 TẤT CẢ BÀI HỌC SHINKANZEN N2 ĐÃ ĐƯỢC SEED THÀNH CÔNG!');
  console.log('======================================================');
}

run()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
