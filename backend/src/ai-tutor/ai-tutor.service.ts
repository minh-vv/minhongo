import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  ExplainDto,
  EvaluateDto,
  ChatDto,
  GrammarExampleDto,
  SaveExampleDto,
} from './dto/ai-tutor.dto';
import { withRetry } from '../common/utils/gemini-retry';
import { PrismaService } from '../prisma/prisma.service';

const GrammarExampleSchema = {
  type: 'object',
  properties: {
    japanese: {
      type: 'string',
      description: 'Câu ví dụ tiếng Nhật tự nhiên, thực tế (có chữ Kanji).',
    },
    romaji: {
      type: 'string',
      description: 'Phiên âm Romaji của câu tiếng Nhật.',
    },
    vietnamese: {
      type: 'string',
      description: 'Bản dịch tiếng Việt chính xác và tự nhiên.',
    },
  },
  required: ['japanese', 'romaji', 'vietnamese'],
};

const EvaluateSchema = {
  type: 'object',
  properties: {
    isCorrect: {
      type: 'boolean',
      description: 'Đúng ngữ pháp tiếng Nhật và sử dụng chính xác cấu trúc/từ vựng được yêu cầu.',
    },
    score: {
      type: 'integer',
      description: 'Điểm số từ 0 đến 100 đánh giá câu trả lời.',
    },
    feedback: {
      type: 'string',
      description: 'Nhận xét chi tiết bằng tiếng Việt về ngữ pháp, lỗi sai nếu có.',
    },
    suggestion: {
      type: 'string',
      description: 'Câu đề xuất tiếng Nhật viết lại tự nhiên và chuẩn xác hơn (kèm kanji).',
    },
  },
  required: ['isCorrect', 'score', 'feedback', 'suggestion'],
};

@Injectable()
export class AiTutorService {
  private readonly logger = new Logger(AiTutorService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private readonly prisma: PrismaService) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not defined in environment variables.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey || 'dummy');
  }

  private getModel(modelName = 'gemini-2.5-flash') {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy') {
      throw new BadRequestException(
        'Chưa cấu hình GEMINI_API_KEY trong file .env',
      );
    }
    return this.genAI.getGenerativeModel({ model: modelName });
  }

  private getModelWithJson(modelName = 'gemini-2.5-flash', schema?: any) {
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'dummy') {
      throw new BadRequestException(
        'Chưa cấu hình GEMINI_API_KEY trong file .env',
      );
    }
    const config: any = { responseMimeType: 'application/json' };
    if (schema) {
      config.responseSchema = schema;
    }
    return this.genAI.getGenerativeModel({
      model: modelName,
      generationConfig: config,
    });
  }

  private async generateContentWithFallback(prompt: string) {
    try {
      return await withRetry(
        () => this.getModel('gemini-2.5-flash').generateContent(prompt),
        { logger: this.logger },
      );
    } catch (primaryError: any) {
      this.logger.warn(
        `Primary model gemini-2.5-flash failed: ${primaryError.message}. Falling back to gemini-1.5-flash...`,
      );
      return await withRetry(
        () => this.getModel('gemini-1.5-flash').generateContent(prompt),
        { logger: this.logger },
      );
    }
  }

  private async generateJsonContentWithFallback(prompt: string, schema?: any) {
    try {
      return await withRetry(
        () =>
          this.getModelWithJson('gemini-2.5-flash', schema).generateContent(
            prompt,
          ),
        { logger: this.logger },
      );
    } catch (primaryError: any) {
      this.logger.warn(
        `Primary model gemini-2.5-flash json failed: ${primaryError.message}. Falling back to gemini-1.5-flash...`,
      );
      return await withRetry(
        () =>
          this.getModelWithJson('gemini-1.5-flash', schema).generateContent(
            prompt,
          ),
        { logger: this.logger },
      );
    }
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
      const result = await this.generateContentWithFallback(prompt);
      return { explanation: result.response.text() };
    } catch (error: any) {
      throw new BadRequestException('Lỗi AI: ' + error.message);
    }
  }

  // 2. AI Đánh giá câu trả lời (Ngữ pháp/Từ vựng)
  async evaluate(userId: string, dto: EvaluateDto) {
    const prompt = `Bạn là một Sensei tiếng Nhật chuyên nghiệp chấm điểm bài tập luyện đặt câu cho học viên.
Yêu cầu đặt câu: "${dto.question}"
${dto.expectedAnswer ? `Cấu trúc/Từ vựng yêu cầu sử dụng: "${dto.expectedAnswer}"` : ''}
Câu viết của học viên: "${dto.userAnswer}"

Hãy kiểm tra kỹ lưỡng câu viết của học viên và đánh giá chi tiết:
1. Kiểm tra xem học viên có sử dụng đúng cấu trúc ngữ pháp / từ vựng được yêu cầu hay không. Nếu không dùng đúng hoặc bỏ sót cấu trúc, đánh giá câu đó là không đạt.
2. Kiểm tra tính chính xác về ngữ pháp tiếng Nhật (trợ từ, chia động từ/tính từ, trật tự từ) và từ vựng.
3. Đưa ra điểm số từ 0 đến 100 theo tiêu chuẩn sau:
   - 100: Câu hoàn toàn chính xác, tự nhiên như người bản xứ và sử dụng đúng cấu trúc.
   - 80-95: Đúng ngữ pháp và cấu trúc yêu cầu, tuy nhiên có thể diễn đạt tự nhiên hơn nữa.
   - 50-79: Sử dụng đúng cấu trúc nhưng mắc lỗi chia từ, sai trợ từ nhẹ, hoặc sai sắc thái từ vựng nhẹ.
   - 0-49: Sai ngữ pháp nghiêm trọng hoặc không sử dụng cấu trúc yêu cầu.
4. Trả về isCorrect=true khi score >= 80 và không có lỗi ngữ pháp nghiêm trọng.
5. Viết nhận xét (feedback) bằng tiếng Việt cực kỳ chi tiết, chỉ rõ lỗi sai (nếu có) và hướng dẫn cách sửa.
6. Đưa ra câu gợi ý viết lại (suggestion) tự nhiên hơn bằng tiếng Nhật (sử dụng Kanji phù hợp).`;

    try {
      const result = await this.generateJsonContentWithFallback(prompt, EvaluateSchema);
      const text = result.response.text().trim();
      const evalResult = JSON.parse(text);

      // Lưu kết quả luyện tập vào cơ sở dữ liệu nếu có cardId
      if (dto.cardId) {
        try {
          await this.prisma.grammarPractice.create({
            data: {
              userId,
              cardId: dto.cardId,
              userAnswer: dto.userAnswer,
              isCorrect: evalResult.isCorrect,
              score: evalResult.score,
              feedback: evalResult.feedback,
              suggestion: evalResult.suggestion,
            },
          });
        } catch (dbError: any) {
          this.logger.error(`Không thể lưu kết quả luyện tập ngữ pháp: ${dbError.message}`, dbError.stack);
        }
      }

      return evalResult;
    } catch (error: any) {
      throw new BadRequestException('Lỗi đánh giá AI: ' + error.message);
    }
  }

  // 2.1 Lấy lịch sử luyện tập của thẻ ngữ pháp
  async getPracticeHistory(userId: string, cardId: string) {
    return this.prisma.grammarPractice.findMany({
      where: {
        userId,
        cardId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });
  }

  // 2.2 Lưu ví dụ từ AI vào mục ưa thích
  async saveExample(userId: string, dto: SaveExampleDto) {
    try {
      return await this.prisma.userSavedExample.create({
        data: {
          userId,
          cardId: dto.cardId,
          japanese: dto.japanese,
          romaji: dto.romaji,
          vietnamese: dto.vietnamese,
        },
      });
    } catch (error: any) {
      // Nếu đã tồn tại bản ghi (lỗi Unique Constraint) thì trả về bản ghi hiện tại
      if (error.code === 'P2002') {
        const existing = await this.prisma.userSavedExample.findFirst({
          where: {
            userId,
            cardId: dto.cardId,
            japanese: dto.japanese,
          },
        });
        if (existing) return existing;
      }
      throw new BadRequestException('Không thể lưu câu ví dụ: ' + error.message);
    }
  }

  // 2.3 Xóa câu ví dụ đã lưu
  async deleteSavedExample(userId: string, id: string) {
    const saved = await this.prisma.userSavedExample.findUnique({
      where: { id },
    });
    if (!saved) {
      throw new NotFoundException('Không tìm thấy câu ví dụ đã lưu');
    }
    if (saved.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền xóa câu ví dụ này');
    }
    return this.prisma.userSavedExample.delete({
      where: { id },
    });
  }

  // 2.4 Lấy danh sách ví dụ đã lưu của thẻ ngữ pháp
  async getSavedExamples(userId: string, cardId: string) {
    return this.prisma.userSavedExample.findMany({
      where: {
        userId,
        cardId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }


  // 3. Luyện Chat với AI
  async chat(dto: ChatDto) {
    const systemInstruction = `Bạn là "Minhongo Sensei", một người bạn Nhật Bản thân thiện giúp học viên luyện tập giao tiếp.
- Giao tiếp bằng tiếng Nhật (kèm romaji hoặc giải thích tiếng Việt nếu người dùng yêu cầu hoặc khi dùng từ khó).
- Nếu người dùng dùng sai ngữ pháp tiếng Nhật, hãy chỉ ra lỗi sai một cách khéo léo trước khi trả lời.
- Trả lời ngắn gọn, tự nhiên, giống một cuộc hội thoại thực tế.`;

    const formattedHistory = dto.history.map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.parts }],
    }));

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: systemInstruction,
      });

      const chat = model.startChat({
        history: formattedHistory,
      });

      const result = await withRetry(() => chat.sendMessage(dto.message), {
        logger: this.logger,
      });
      return { reply: result.response.text() };
    } catch (primaryError: any) {
      this.logger.warn(
        `Primary model gemini-2.5-flash chat failed: ${primaryError.message}. Falling back to gemini-1.5-flash...`,
      );

      try {
        const fallbackModel = this.genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          systemInstruction: systemInstruction,
        });

        const chat = fallbackModel.startChat({
          history: formattedHistory,
        });

        const result = await withRetry(() => chat.sendMessage(dto.message), {
          logger: this.logger,
        });
        return { reply: result.response.text() };
      } catch (error: any) {
        throw new BadRequestException('Lỗi AI Chat: ' + error.message);
      }
    }
  }

  // 4. AI Tạo ví dụ mới cho ngữ pháp
  async generateGrammarExample(dto: GrammarExampleDto) {
    const prompt = `Bạn là Sensei tiếng Nhật chuyên nghiệp. Hãy tạo ra 1 câu ví dụ tiếng Nhật mới và độc đáo sử dụng cấu trúc ngữ pháp sau:
Cấu trúc: "${dto.grammarStructure}"
Ý nghĩa/Cách dùng: "${dto.meaning}"

Yêu cầu:
1. Câu ví dụ phải tự nhiên, thực tế và sử dụng chính xác cấu trúc ngữ pháp đó.
2. Cung cấp câu tiếng Nhật (có kanji), phiên âm Romaji đầy đủ, và bản dịch tiếng Việt tương ứng.`;

    try {
      const result = await this.generateJsonContentWithFallback(prompt, GrammarExampleSchema);
      const text = result.response.text().trim();
      return JSON.parse(text);
    } catch (error: any) {
      throw new BadRequestException('Lỗi sinh câu ví dụ AI: ' + error.message);
    }
  }
}
