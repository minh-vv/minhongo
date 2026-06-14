import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
  BadRequestException,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import type { Request as ExpressRequest } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { FlashcardsService } from './flashcards.service';
import {
  CreateDeckDto,
  UpdateDeckDto,
  CreateCardDto,
  UpdateCardDto,
  ReviewCardDto,
  ImportDeckDto,
} from './dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

interface RequestWithUser extends ExpressRequest {
  user: {
    id: string;
    email: string;
    isAdmin?: boolean;
  };
}

/** Chỉ chấp nhận file .apkg từ Anki */
const ankiFileFilter = (
  _req: ExpressRequest,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) => {
  if (!file.originalname.toLowerCase().endsWith('.apkg')) {
    return cb(new BadRequestException('Chỉ chấp nhận file .apkg'), false);
  }
  cb(null, true);
};

@Controller('flashcards')
export class FlashcardsController {
  constructor(private flashcardsService: FlashcardsService) {}

  // ========== PUBLIC ROUTES (không cần đăng nhập) ==========

  @Get('public')
  getPublicDecks() {
    return this.flashcardsService.getPublicDecks();
  }

  @Get('public/:deckId')
  getPublicDeckById(@Param('deckId') deckId: string) {
    return this.flashcardsService.getPublicDeckById(deckId);
  }

  // ========== PROTECTED ROUTES — đường dẫn tĩnh trước, param sau ==========

  @UseGuards(JwtAuthGuard)
  @Get()
  getDecks(@Request() req: RequestWithUser) {
    return this.flashcardsService.getDecks(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  createDeck(@Request() req: RequestWithUser, @Body() dto: CreateDeckDto) {
    return this.flashcardsService.createDeck(req.user.id, dto);
  }

  // ========== STUDY STATS (tĩnh — phải khai báo trước :deckId) ==========

  @UseGuards(JwtAuthGuard)
  @Get('stats/history')
  getStudyHistory(
    @Request() req: RequestWithUser,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    const safeDays = Math.min(Math.max(days, 1), 365);
    return this.flashcardsService.getStudyHistory(req.user.id, safeDays);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/gamification')
  getGamificationSummary(@Request() req: RequestWithUser) {
    return this.flashcardsService.getGamificationSummary(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('stats/leaderboard')
  getLeaderboard(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const safeDays = Math.min(Math.max(days, 1), 365);
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    return this.flashcardsService.getLeaderboard(safeDays, safeLimit);
  }

  // ========== IMPORT ANKI (tĩnh — phải khai báo trước :deckId) ==========

  @UseGuards(JwtAuthGuard)
  @Post('import/preview')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: ankiFileFilter,
    }),
  )
  previewAnkiFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('Vui lòng upload file .apkg');
    return this.flashcardsService.previewAnkiFile(file.buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: ankiFileFilter,
    }),
  )
  async importAnkiDeck(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportDeckDto,
    @Request() req: RequestWithUser,
  ) {
    if (!file) throw new BadRequestException('Vui lòng upload file .apkg');
    // Chỉ admin mới được import deck công khai.
    // dto.isPublic đã được @Transform trong DTO chuyển string "true" → boolean.
    if (dto.isPublic && !req.user.isAdmin) {
      throw new ForbiddenException('Chỉ admin mới có thể tạo deck công khai');
    }
    return this.flashcardsService.importAnkiDeck(req.user.id, file.buffer, dto);
  }

  // ========== CARD ROUTES (tĩnh prefix "cards/" trước :deckId) ==========

  @UseGuards(JwtAuthGuard)
  @Put('cards/:cardId')
  updateCard(
    @Param('cardId') cardId: string,
    @Request() req: RequestWithUser,
    @Body() dto: UpdateCardDto,
  ) {
    return this.flashcardsService.updateCard(
      cardId,
      req.user.id,
      dto,
      req.user.isAdmin,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cards/:cardId')
  deleteCard(@Param('cardId') cardId: string, @Request() req: RequestWithUser) {
    return this.flashcardsService.deleteCard(
      cardId,
      req.user.id,
      req.user.isAdmin,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('cards/:cardId/review')
  reviewCard(
    @Param('cardId') cardId: string,
    @Request() req: RequestWithUser,
    @Body() dto: ReviewCardDto,
  ) {
    return this.flashcardsService.reviewCard(cardId, req.user.id, dto.quality);
  }

  // ========== DECK PARAM ROUTES (:deckId — khai báo sau tất cả đường dẫn tĩnh) ==========

  @UseGuards(JwtAuthGuard)
  @Get(':deckId')
  getDeck(@Param('deckId') deckId: string, @Request() req: RequestWithUser) {
    return this.flashcardsService.getDeckById(deckId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':deckId')
  updateDeck(
    @Param('deckId') deckId: string,
    @Request() req: RequestWithUser,
    @Body() dto: UpdateDeckDto,
  ) {
    return this.flashcardsService.updateDeck(
      deckId,
      req.user.id,
      dto,
      req.user.isAdmin,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':deckId')
  deleteDeck(@Param('deckId') deckId: string, @Request() req: RequestWithUser) {
    return this.flashcardsService.deleteDeck(
      deckId,
      req.user.id,
      req.user.isAdmin,
    );
  }

  /**
   * PATCH /flashcards/:deckId/publish
   * Toggle trạng thái công khai của deck (chỉ chủ sở hữu).
   * Body: { isPublic: boolean }
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':deckId/publish')
  publishDeck(
    @Param('deckId') deckId: string,
    @Request() req: RequestWithUser,
    @Body('isPublic') isPublic: boolean,
  ) {
    return this.flashcardsService.publishDeck(
      deckId,
      req.user.id,
      isPublic,
      req.user.isAdmin,
    );
  }

  /**
   * POST /flashcards/:deckId/clone
   * Clone một deck công khai về thư viện cá nhân của user.
   */
  @UseGuards(JwtAuthGuard)
  @Post(':deckId/clone')
  cloneDeck(@Param('deckId') deckId: string, @Request() req: RequestWithUser) {
    return this.flashcardsService.cloneDeck(deckId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':deckId/cards')
  createCard(
    @Param('deckId') deckId: string,
    @Request() req: RequestWithUser,
    @Body() dto: CreateCardDto,
  ) {
    return this.flashcardsService.createCard(
      deckId,
      req.user.id,
      dto,
      req.user.isAdmin,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post(':deckId/cards/bulk')
  createCardsBulk(
    @Param('deckId') deckId: string,
    @Request() req: RequestWithUser,
    @Body('cards') cards: CreateCardDto[],
  ) {
    return this.flashcardsService.createCardsBulk(
      deckId,
      req.user.id,
      cards,
      req.user.isAdmin,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':deckId/due')
  getDueCards(
    @Param('deckId') deckId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.flashcardsService.getDueCards(deckId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':deckId/stats')
  getDeckStats(
    @Param('deckId') deckId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.flashcardsService.getDeckStats(deckId, req.user.id);
  }
}
