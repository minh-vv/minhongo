import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import 'dotenv/config';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

async function run() {
  const pdfPath = path.join(__dirname, '../../../filenguon/Shinkanzen Master N2 Bunpou (tiếng Việt).pdf');
  
  if (!fs.existsSync(pdfPath)) {
    console.error(`File not found at: ${pdfPath}`);
    process.exit(1);
  }

  console.log(`Reading PDF file: ${pdfPath}`);
  const pdfBuffer = fs.readFileSync(pdfPath);
  const base64Pdf = pdfBuffer.toString('base64');

  console.log('Sending PDF to Gemini for Table of Contents extraction...');
  
  // We use gemini-3.1-flash-lite which natively supports PDF input
  const model = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });

  const prompt = `
Bạn là trợ lý giảng dạy tiếng Nhật chuyên nghiệp. 
Đây là cuốn sách ngữ pháp "Shinkanzen Master N2 Bunpou" dịch tiếng Việt ở định dạng PDF.
Hãy phân tích file sách này và trả về danh sách tất cả các chương/bài học lớn (Chapters/Lessons) có trong sách.
Yêu cầu định dạng trả về là một mảng JSON thô (không có thẻ bao ngoài kiểu markdown \`\`\`json) theo cấu trúc sau:
[
  {
    "order": 1,
    "title": "Tên chương / Bài học bằng tiếng Nhật và tiếng Việt",
    "description": "Tóm tắt các cấu trúc ngữ pháp chính được dạy trong chương này (ví dụ: 〜に際して, 〜にわたって...)"
  }
]
Chú ý:
- Chỉ trả về chuỗi JSON thô, không thêm bất kỳ văn bản giải thích nào khác ở đầu hay cuối.
- Nếu chương có nhiều mục nhỏ, hãy nhóm chúng lại thành các bài học hợp lý (khoảng 10-25 bài học cho cả cuốn sách).
`;

  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Pdf,
          mimeType: 'application/pdf'
        }
      },
      prompt
    ]);

    const responseText = result.response.text().trim();
    console.log('--- GEMINI RESPONSE ---');
    console.log(responseText);
    console.log('-----------------------');

    // Save to a temporary TOC file
    const tocPath = path.join(__dirname, 'shinkansen-toc.json');
    fs.writeFileSync(tocPath, responseText);
    console.log(`Saved Table of Contents to: ${tocPath}`);

  } catch (error) {
    console.error('Error calling Gemini:', error);
  }
}

run();
