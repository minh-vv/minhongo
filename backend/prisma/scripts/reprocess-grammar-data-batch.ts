import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ Missing GEMINI_API_KEY in environment variables!');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
// Using gemini-3.1-flash-lite as the standard reliable model
const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

const DATA_DIR = path.join(__dirname, '..', 'data');
const CACHE_DIR = path.join(__dirname, 'reprocess-cache');
const BATCH_SIZE = 5; // Process 5 lessons per API call to reduce request frequency
const BATCH_DELAY_MS = 15000; // 15 seconds delay between batches (5 RPM free tier)

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

async function callGeminiWithRetry(prompt: string, maxRetries = 5): Promise<string> {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      const result = await model.generateContent([prompt]);
      return result.response.text();
    } catch (error: any) {
      attempt++;
      console.warn(`  ⚠️ [Gemini API] Attempt ${attempt} failed: ${error.message || error}`);
      if (attempt >= maxRetries) {
        throw error;
      }
      const waitTime = attempt * 20000; // 20s, 40s, 60s...
      console.log(`  Waiting ${waitTime / 1000}s before retrying due to API error/quota...`);
      await sleep(waitTime);
    }
  }
  throw new Error('Gemini API failed after max retries.');
}

interface Card {
  front: string;
  back: string;
  romaji: string;
  example: string;
  jlptLevel: number;
}

interface Lesson {
  order: number;
  title: string;
  summary: string;
  theoryMd: string;
  skills: string[];
  estimatedMin: number;
  decks: {
    role: string;
    order: number;
    deck: {
      name: string;
      description: string;
      category: string;
      jlptLevel: number;
      cards: Card[];
    };
  }[];
  test: {
    passScore: number;
    questionCount: number;
  };
}

interface ProcessedBatchItem {
  order: number;
  cards: {
    front: string;
    back: string;
    romaji: string;
    example: string;
  }[];
  theoryMd: string;
}

async function reprocessBatch(lessons: Lesson[], level: number): Promise<ProcessedBatchItem[]> {
  const batchData = lessons.map(lesson => {
    const grammarDeckWrapper = lesson.decks.find(d => d.role === 'GRAMMAR' || d.deck?.category === 'NGUPHAP');
    const cards = grammarDeckWrapper?.deck?.cards || [];
    return {
      order: lesson.order,
      title: lesson.title,
      summary: lesson.summary,
      cards: cards
    };
  });

  const prompt = `
Bạn là một chuyên gia biên soạn tài liệu giảng dạy tiếng Nhật chất lượng cao.
Nhiệm vụ của bạn là chuẩn hóa và làm sạch dữ liệu ngữ pháp JLPT cấp độ N${level} cho danh sách ${lessons.length} bài học sau:

${JSON.stringify(batchData, null, 2)}

Hãy chuẩn hóa lại từng bài học để thu được các trường có cấu trúc sau cho từng thẻ ngữ pháp ("cards") trong bài học:
1. "front" (Ngữ pháp): Chỉ chứa mẫu ngữ pháp thuần túy, sạch sẽ, không chứa nghĩa tiếng Việt, không chứa số thứ tự. Ví dụ: "〜にしろ〜にしろ" thay vì "〜にしろ〜にしろ – Dù… hay…".
2. "back" (Ý nghĩa & Cấu trúc): Định dạng thành văn bản nhiều dòng chính xác theo cấu trúc sau:
Ý nghĩa: [Giải thích ngắn gọn ý nghĩa tiếng Việt của ngữ pháp]
Cấu trúc: [Công thức kết hợp ngắn gọn, rõ ràng, ví dụ: N / V-ru / V-ta + にしろ]
3. "romaji": Cách đọc romaji sạch sẽ của mẫu ngữ pháp (ví dụ: "ni-shiro-ni-shiro").
4. "example" (Ví dụ): Định dạng tối thiểu 3-4 ví dụ tiêu biểu. Tách biệt câu tiếng Nhật và dịch nghĩa thành từng cặp dòng:
Dòng 1: Câu ví dụ tiếng Nhật (sạch sẽ, không có romaji hay nghĩa trong ngoặc)
Dòng 2: Nghĩa tiếng Việt của câu
Các ví dụ phân cách bằng đúng một dòng trống (dấu xuống dòng kép \\n\\n).

Ví dụ cấu trúc ví dụ mẫu cho trường "example":
学生にしろ社会人にしろ、時間管理は大切だ。
Dù là sinh viên hay người đi làm, quản lý thời gian đều quan trọng.

行くにしろ行かないにしろ、早めに連絡してください。
Dù đi hay không đi, hãy liên lạc sớm.

高いにしろ安いにしろ、品質は確認すべきだ。
Dù đắt hay rẻ, vẫn nên kiểm tra chất lượng.

Đồng thời viết lại trường "theoryMd" là một chuỗi văn bản lý thuyết Markdown chất lượng cao của bài học này, được viết lại một cách trực quan, đẹp mắt. Trong đó, mỗi điểm ngữ pháp phải được trình bày rõ ràng với các mục nhỏ: '### 1. [Mẫu ngữ pháp]', '#### 💡 Cấu trúc & Ý nghĩa', và '#### 📝 Ví dụ minh họa' sử dụng định dạng Markdown chuẩn phù hợp với hệ thống.

Hãy trả về kết quả dưới dạng chuỗi JSON thô (không bao quanh bởi các thẻ markdown \`\`\`json) theo đúng cấu trúc của một mảng các bài học đã được cập nhật:
[
  {
    "order": [số order tương ứng của bài học],
    "cards": [
      {
        "front": "...",
        "back": "Ý nghĩa: ...\\nCấu trúc: ...",
        "romaji": "...",
        "example": "..."
      }
    ],
    "theoryMd": "[Nội dung lý thuyết Markdown của bài học này, ký tự xuống dòng biểu diễn bằng \\n]"
  }
]

Chú ý:
- Chỉ trả về chuỗi JSON thô hợp lệ là một mảng các đối tượng, không chứa bất cứ văn bản nào khác.
- Giữ nguyên số "order" chính xác tương ứng với mỗi bài học.
- Đảm bảo "theoryMd" là một chuỗi văn bản hợp lệ, các ký tự xuống dòng biểu diễn bằng \\n.
`;

  const responseText = await callGeminiWithRetry(prompt);
  const cleanedText = cleanJson(responseText);
  
  try {
    const result = JSON.parse(cleanedText);
    if (!Array.isArray(result)) {
      throw new Error('Response is not an array.');
    }
    return result;
  } catch (err: any) {
    console.error(`  ❌ Failed to parse JSON from Gemini response. Raw response was:\n${responseText}`);
    throw new Error(`Invalid JSON format: ${err.message}`);
  }
}

async function processFile(filename: string, level: number) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️ File ${filename} not found, skipping.`);
    return;
  }

  console.log(`\n==================================================`);
  console.log(`📖 BATCH PROCESSING FILE: ${filename} (JLPT N${level})`);
  console.log(`==================================================`);

  const fileContent = fs.readFileSync(filePath, 'utf8');
  const lessons: Lesson[] = JSON.parse(fileContent);
  const totalLessons = lessons.length;

  // 1. Identify which lessons are uncached
  const uncachedLessons: Lesson[] = [];
  const processedLessonsMap = new Map<number, Lesson>();

  for (const lesson of lessons) {
    const cacheFile = path.join(CACHE_DIR, `n${level}-lesson-${lesson.order}.json`);
    if (fs.existsSync(cacheFile)) {
      const cachedData = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      processedLessonsMap.set(lesson.order, cachedData);
    } else {
      uncachedLessons.push(lesson);
    }
  }

  console.log(`📊 Status: Total ${totalLessons} lessons, ${processedLessonsMap.size} cached, ${uncachedLessons.length} to process.`);

  // 2. Process uncached lessons in batches
  for (let i = 0; i < uncachedLessons.length; i += BATCH_SIZE) {
    const batch = uncachedLessons.slice(i, i + BATCH_SIZE);
    const batchIndexStr = `Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(uncachedLessons.length / BATCH_SIZE)}`;
    console.log(`🚀 [N${level}] Starting ${batchIndexStr} with ${batch.length} lessons (Orders: ${batch.map(b => b.order).join(', ')})...`);

    try {
      const results = await reprocessBatch(batch, level);
      
      // Save results to cache
      for (const res of results) {
        const matchingLesson = batch.find(b => b.order === res.order);
        if (!matchingLesson) {
          console.warn(`  ⚠️ Received output for unknown lesson order: ${res.order}`);
          continue;
        }

        const updatedLesson = { ...matchingLesson };
        updatedLesson.theoryMd = res.theoryMd || matchingLesson.theoryMd;

        const grammarDeckIndex = updatedLesson.decks.findIndex(d => d.role === 'GRAMMAR' || d.deck?.category === 'NGUPHAP');
        if (grammarDeckIndex !== -1 && updatedLesson.decks[grammarDeckIndex].deck) {
          updatedLesson.decks[grammarDeckIndex].deck.cards = res.cards.map((c: any) => ({
            front: c.front || '',
            back: c.back || '',
            romaji: c.romaji || '',
            example: c.example || '',
            jlptLevel: level
          }));
        }

        const cacheFile = path.join(CACHE_DIR, `n${level}-lesson-${res.order}.json`);
        fs.writeFileSync(cacheFile, JSON.stringify(updatedLesson, null, 2), 'utf8');
        processedLessonsMap.set(res.order, updatedLesson);
      }

      console.log(`  💾 [Save] Cached results for ${batch.length} lessons.`);
      
      // Stagger request if there are more batches left
      if (i + BATCH_SIZE < uncachedLessons.length) {
        console.log(`  Waiting ${BATCH_DELAY_MS / 1000}s to avoid rate limits...`);
        await sleep(BATCH_DELAY_MS);
      }
    } catch (err: any) {
      console.error(`  ❌ Failed to reprocess ${batchIndexStr}: ${err.message}`);
      console.log('Stopping execution due to failure.');
      process.exit(1);
    }
  }

  // 3. Assemble and overwrite the original file
  const finalLessons: Lesson[] = [];
  for (const lesson of lessons) {
    const processed = processedLessonsMap.get(lesson.order);
    if (processed) {
      finalLessons.push(processed);
    } else {
      console.error(`❌ Missing processed lesson for order ${lesson.order}!`);
      process.exit(1);
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(finalLessons, null, 2), 'utf8');
  console.log(`✨ Completed batch reprocessing ${filename}! File updated successfully.`);
}

async function main() {
  console.log('🧼 Starting grammar data batch reprocessing pipeline...');
  
  // Reprocess N5 Grammar
  await processFile('minna-n5-lessons.json', 5);
  
  // Reprocess N4 Grammar
  await processFile('minna-n4-lessons.json', 4);
  
  // Reprocess N3 Grammar
  await processFile('shinkanzen-n3-grammar-lessons.json', 3);
  
  // Reprocess N2 Grammar
  await processFile('shinkanzen-n2-grammar-lessons.json', 2);
  
  // Reprocess N1 Grammar
  await processFile('shinkanzen-n1-grammar-lessons.json', 1);

  console.log('\n🎉 Batch reprocessing pipeline finished successfully!');
}

main().catch((err) => {
  console.error('❌ Pipeline failed:', err);
  process.exit(1);
});
