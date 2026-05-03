import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ForbiddenException,
} from '@nestjs/common';
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

interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    isAdmin?: boolean;
  };
}

@Controller('flashcards')
export class FlashcardsController {
  constructor(private flashcardsService: FlashcardsService) {}

  // ========== PUBLIC ROUTES ==========

  @Get('public')
  getPublicDecks() {
    return this.flashcardsService.getPublicDecks();
  }

  @Get('public/:deckId')
  getPublicDeckById(@Param('deckId') deckId: string) {
    return this.flashcardsService.getPublicDeckById(deckId);
  }

  @Get(':deckId')
  @UseGuards(JwtAuthGuard)
  async getDeck(
    @Param('deckId') deckId: string,
    @Request() req: RequestWithUser,
  ) {
    return this.flashcardsService.getDeckById(deckId, req.user.id);
  }

  // ========== PROTECTED ROUTES ==========

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

  @UseGuards(JwtAuthGuard)
  @Put(':deckId')
  updateDeck(
    @Param('deckId') deckId: string,
    @Request() req: RequestWithUser,
    @Body() dto: UpdateDeckDto,
  ) {
    return this.flashcardsService.updateDeck(deckId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':deckId')
  deleteDeck(@Param('deckId') deckId: string, @Request() req: RequestWithUser) {
    return this.flashcardsService.deleteDeck(deckId, req.user.id);
  }

  // ========== CARD ROUTES ==========

  @UseGuards(JwtAuthGuard)
  @Post(':deckId/cards')
  createCard(
    @Param('deckId') deckId: string,
    @Request() req: RequestWithUser,
    @Body() dto: CreateCardDto,
  ) {
    return this.flashcardsService.createCard(deckId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('cards/:cardId')
  updateCard(
    @Param('cardId') cardId: string,
    @Request() req: RequestWithUser,
    @Body() dto: UpdateCardDto,
  ) {
    return this.flashcardsService.updateCard(cardId, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('cards/:cardId')
  deleteCard(@Param('cardId') cardId: string, @Request() req: RequestWithUser) {
    return this.flashcardsService.deleteCard(cardId, req.user.id);
  }

  // ========== SRS ROUTES ==========

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

  @UseGuards(JwtAuthGuard)
  @Post('cards/:cardId/review')
  reviewCard(
    @Param('cardId') cardId: string,
    @Request() req: RequestWithUser,
    @Body() dto: ReviewCardDto,
  ) {
    return this.flashcardsService.reviewCard(cardId, req.user.id, dto.quality);
  }

  // ========== IMPORT ANKI ROUTES ==========

  @UseGuards(JwtAuthGuard)
  @Post('import/preview')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  previewAnkiFile(@UploadedFile() file: Express.Multer.File) {
    return this.flashcardsService.previewAnkiFile(file.buffer);
  }

  @UseGuards(JwtAuthGuard)
  @Post('import')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 },
    }),
  )
  async importAnkiDeck(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImportDeckDto,
    @Request() req: RequestWithUser,
  ) {
    // Chỉ admin mới được import deck công khai
    // dto.isPublic có thể là string "true" từ FormData
    const wantsPublic = dto.isPublic === true || (dto.isPublic as unknown as string) === 'true';
    if (wantsPublic && !req.user.isAdmin) {
      throw new ForbiddenException('Chỉ admin mới có thể tạo deck công khai');
    }
    return this.flashcardsService.importAnkiDeck(req.user.id, file.buffer, dto);
  }
}
