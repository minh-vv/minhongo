import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Request as ExpressRequest } from 'express';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/admin/admin.guard';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import { UpdateFeedbackDto } from './dto/update-feedback.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

interface RequestWithUser extends ExpressRequest {
  user: { id: string; email: string; isAdmin?: boolean };
}

@Controller()
export class FeedbackController {
  constructor(private feedbackService: FeedbackService) {}

  // ── User endpoints ──────────────────────────────────────────────────────

  /** Gửi feedback mới (multipart/form-data, tối đa 3 ảnh) */
  @Post('feedback')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', 3, {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB mỗi file
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          cb(new Error('Chỉ chấp nhận file ảnh'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  createFeedback(
    @Request() req: RequestWithUser,
    @Body() dto: CreateFeedbackDto,
    @UploadedFiles() files?: Express.Multer.File[],
  ) {
    return this.feedbackService.createFeedback(
      req.user.id,
      dto.type,
      dto.message,
      files,
    );
  }

  /** Xem feedback của chính mình */
  @Get('feedback/mine')
  @UseGuards(JwtAuthGuard)
  getMyFeedbacks(
    @Request() req: RequestWithUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.feedbackService.getMyFeedbacks(
      req.user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  /** Phản hồi/comment vào feedback */
  @Post('feedback/:id/comment')
  @UseGuards(JwtAuthGuard)
  addComment(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.feedbackService.addComment(
      req.user.id,
      id,
      dto.message,
      req.user.isAdmin,
    );
  }

  // ── Admin endpoints ─────────────────────────────────────────────────────

  /** Lấy tất cả feedback (phân trang, filter) */
  @Get('admin/feedbacks')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getAllFeedbacks(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
    return this.feedbackService.getAllFeedbacks(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      type,
      status,
    );
  }

  /** Thống kê tổng hợp */
  @Get('admin/feedbacks/stats')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getFeedbackStats() {
    return this.feedbackService.getFeedbackStats();
  }

  /** Cập nhật status / admin note */
  @Patch('admin/feedbacks/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  updateFeedback(
    @Param('id') id: string,
    @Body() dto: UpdateFeedbackDto,
  ) {
    return this.feedbackService.updateFeedback(id, dto);
  }

  /** Xóa feedback */
  @Delete('admin/feedbacks/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  deleteFeedback(@Param('id') id: string) {
    return this.feedbackService.deleteFeedback(id);
  }
}
