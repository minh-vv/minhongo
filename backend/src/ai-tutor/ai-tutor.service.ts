import { Injectable, BadRequestException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ExplainDto, EvaluateDto, ChatDto } from './dto/ai-tutor.dto';

@Injectable()
export class AiTutorService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy');
  }

  private getModel() {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy') {
      throw new BadRequestException('Chưa cấu hình GEMINI_API_KEY trong file .env');
    }
    return this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  // 1. AI Giải thích chi tiết
  async explain(dto: ExplainDto) {
    const prompt = `Bạn là một gia sư tiếng Nhật chuyên nghiệp (Sensei). Học sinh của bạn muốn hiểu rõ hơn về:
"${dto.text}"

${dto.context ? `Ngữ cảnh: "${dto.context}"` : ''}

Nhiệm vụ của bạn:
1. Giải thích chi tiết ý nghĩa của từ/ngữ pháp/câu này.
2. Nêu cách dùng cơ bản (nếu là ngữ pháp) hoặc các từ liên quan (nếu là từ vựng).
3. Đưa ra 2-3 ví dụ minh họa kèm nghĩa tiếng Việt.
Trả về bằng định dạng Markdown ngắn gọn, dễ hiểu.`;

    try {
      const result = await this.getModel().generateContent(prompt);
      return { explanation: result.response.text() };
    } catch (error: any) {
      throw new BadRequestException('Lỗi AI: ' + error.message);
    }
  }

  // 2. AI Đánh giá câu trả lời (Ngữ pháp/Từ vựng)
  async evaluate(dto: EvaluateDto) {
    const prompt = `Bạn là Sensei chấm điểm cho học viên tiếng Nhật.
Câu hỏi: "${dto.question}"
${dto.expectedAnswer ? `Đáp án mong muốn (Gợi ý): "${dto.expectedAnswer}"` : ''}
Câu trả lời của học viên: "${dto.userAnswer}"

Hãy đánh giá câu trả lời của học viên:
1. Tính chính xác (từ vựng, ngữ pháp).
2. Nếu sai, chỉ ra lỗi và giải thích ngắn gọn tại sao sai.
3. Đề xuất cách diễn đạt tự nhiên hơn (nếu có).

Trả về dữ liệu dạng JSON thuần túy (không bọc trong markdown tick) với cấu trúc sau:
{
  "isCorrect": true/false,
  "score": 85,
  "feedback": "[Nhận xét chi tiết]",
  "suggestion": "[Cách diễn đạt tốt hơn]"
}`;

    try {
      const result = await this.getModel().generateContent(prompt);
      let text = result.response.text().trim();
      if (text.startsWith('\`\`\`json')) {
        text = text.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
      } else if (text.startsWith('\`\`\`')) {
        text = text.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '');
      }
      return JSON.parse(text);
    } catch (error: any) {
      throw new BadRequestException('Lỗi đánh giá AI: ' + error.message);
    }
  }

  // 3. Luyện Chat với AI
  async chat(dto: ChatDto) {
    const systemInstruction = `Bạn là "Minhongo Sensei", một người bạn Nhật Bản thân thiện giúp học viên luyện tập giao tiếp.
- Giao tiếp bằng tiếng Nhật (kèm romaji hoặc giải thích tiếng Việt nếu người dùng yêu cầu hoặc khi dùng từ khó).
- Nếu người dùng dùng sai ngữ pháp tiếng Nhật, hãy chỉ ra lỗi sai một cách khéo léo trước khi trả lời.
- Trả lời ngắn gọn, tự nhiên, giống một cuộc hội thoại thực tế.`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemInstruction
      });

      const formattedHistory = dto.history.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }]
      }));

      const chat = model.startChat({
        history: formattedHistory,
      });

      const result = await chat.sendMessage(dto.message);
      return { reply: result.response.text() };
    } catch (error: any) {
      throw new BadRequestException('Lỗi AI Chat: ' + error.message);
    }
  }
}
