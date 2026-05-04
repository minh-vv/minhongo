import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as nodemailer from 'nodemailer';

interface SafeUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  isBlocked: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const isPasswordValid = await bcrypt.compare(password, user.password);
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Chặn đăng nhập nếu tài khoản đã bị admin khóa
    if (user.isBlocked) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.',
      );
    }

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { password: _, ...result } = user;
    /* eslint-enable @typescript-eslint/no-unused-vars */
    return result;
  }

  async register(email: string, password: string, name?: string) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const hashedPassword = await bcrypt.hash(password, 10);
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

    const user = await this.prisma.user.create({
      data: {
        email,
        /* eslint-disable @typescript-eslint/no-unsafe-assignment */
        password: hashedPassword,
        /* eslint-enable @typescript-eslint/no-unsafe-assignment */
        name,
      },
    });

    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { password: _, ...result } = user;
    /* eslint-enable @typescript-eslint/no-unused-vars */
    return result;
  }

  // ========== FORGOT / RESET PASSWORD ==========

  /**
   * Bước 1: Tạo reset token và gửi email.
   * Luôn trả về thành công (không tiết lộ email có tồn tại hay không).
   */
  async forgotPassword(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Không tiết lộ user có tồn tại hay không — tránh user enumeration attack
    if (!user || user.isBlocked) return;

    // Tạo token ngẫu nhiên 32 bytes
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: token, passwordResetExpires: expiry },
    });

    const frontendUrl =
      process.env.FRONTEND_URL || 'http://localhost:5175';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // In ra console để dev có thể test mà không cần SMTP
    console.log('\n─────────────────────────────────────────');
    console.log(`[ForgotPassword] Email : ${email}`);
    console.log(`[ForgotPassword] URL   : ${resetUrl}`);
    console.log('─────────────────────────────────────────\n');

    // Gửi email nếu SMTP được cấu hình
    await this.sendResetEmail(email, user.name, resetUrl).catch((err: Error) => {
      console.warn('[ForgotPassword] Gửi email thất bại:', err.message);
    });
  }

  /**
   * Bước 2: Xác thực token và cập nhật mật khẩu mới.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (1 giờ).',
      );
    }

    /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  /** Gửi email reset password qua SMTP (nếu env có cấu hình). */
  private async sendResetEmail(
    to: string,
    name: string | null,
    resetUrl: string,
  ): Promise<void> {
    const host = process.env.SMTP_HOST;
    if (!host) return; // Không có SMTP → bỏ qua

    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Minhongo" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
      to,
      subject: 'Đặt lại mật khẩu Minhongo',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;">
          <h2 style="color:#1a237e;margin-bottom:8px;">Đặt lại mật khẩu</h2>
          <p style="color:#555;">Xin chào ${name || 'bạn'},</p>
          <p style="color:#555;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản
            <strong>${to}</strong>. Link có hiệu lực trong <strong>1 giờ</strong>.</p>
          <a href="${resetUrl}"
             style="display:inline-block;margin:20px 0;padding:12px 28px;
                    background:#c62828;color:#fff;text-decoration:none;font-weight:700;">
            Đặt lại mật khẩu
          </a>
          <p style="color:#999;font-size:12px;">
            Nếu bạn không yêu cầu, hãy bỏ qua email này.<br/>
            Link: <a href="${resetUrl}">${resetUrl}</a>
          </p>
        </div>`,
    });
  }

  // ========== LOGIN ==========

  login(user: SafeUser) {
    const payload = { email: user.email, sub: user.id, isAdmin: user.isAdmin };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        isAdmin: user.isAdmin,
      },
    };
  }
}
