import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { SystemConfigService } from 'src/system-config/system-config.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
// nodemailer dùng require để tránh lỗi ESM/CJS interop với emitDecoratorMetadata
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nodemailer = require('nodemailer') as typeof import('nodemailer');

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
    private systemConfig: SystemConfigService,
  ) {}

  async validateUser(email: string, password: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Chặn đăng nhập nếu tài khoản đã bị admin khóa
    if (user.isBlocked) {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ admin để được hỗ trợ.',
      );
    }

    const { password: _, ...result } = user;

    return result;
  }

  async register(email: string, password: string, name?: string) {
    const regOpen = await this.systemConfig.isRegistrationAllowed();
    if (!regOpen) {
      throw new ForbiddenException(
        'Đăng ký tạm thời đã đóng. Vui lòng quay lại sau hoặc liên hệ quản trị viên.',
      );
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        email,

        password: hashedPassword,

        name,
      },
    });

    const { password: _, ...result } = user;

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
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetToken: hashedToken, passwordResetExpires: expiry },
    });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

    // In ra console để dev có thể test mà không cần SMTP
    console.log('\n─────────────────────────────────────────');
    console.log(`[ForgotPassword] Email : ${email}`);
    console.log(`[ForgotPassword] URL   : ${resetUrl}`);
    console.log('─────────────────────────────────────────\n');

    // Gửi email nếu SMTP được cấu hình
    await this.sendResetEmail(email, user.name, resetUrl).catch(
      (err: Error) => {
        console.warn('[ForgotPassword] Gửi email thất bại:', err.message);
      },
    );
  }

  /**
   * Bước 2: Xác thực token và cập nhật mật khẩu mới.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (1 giờ).',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
  }

  /** Gửi email reset password qua Gmail SMTP. */
  private async sendResetEmail(
    to: string,
    name: string | null,
    resetUrl: string,
  ): Promise<void> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpHost || !smtpUser || !smtpPass) {
      console.warn('[Mail] SMTP chưa cấu hình — bỏ qua gửi email.');
      return;
    }

    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = port === 465; // port 465 = SSL, 587 = STARTTLS

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port,
      secure,
      auth: { user: smtpUser, pass: smtpPass },
      tls: { rejectUnauthorized: false }, // cho phép cert tự ký trong dev
    });

    const fromField = process.env.SMTP_FROM || smtpUser;

    const html = `
<!DOCTYPE html>
<html lang="vi">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:32px 0;">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0"
        style="background:#fff;border:1px solid #e0e0e0;max-width:480px;">

        <!-- Header -->
        <tr>
          <td style="background:#1a237e;padding:24px 32px;">
            <span style="color:#fff;font-size:22px;font-weight:900;letter-spacing:-0.5px;">
              Minhongo
            </span>
            <span style="color:rgba(255,255,255,0.5);font-size:13px;margin-left:8px;">
              学日本語
            </span>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;color:#1a237e;font-size:20px;">
              Đặt lại mật khẩu
            </h2>
            <p style="margin:0 0 12px;color:#444;font-size:14px;line-height:1.6;">
              Xin chào <strong>${name || 'bạn'}</strong>,
            </p>
            <p style="margin:0 0 24px;color:#444;font-size:14px;line-height:1.6;">
              Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản
              <strong style="color:#1a237e;">${to}</strong>.
              Link bên dưới có hiệu lực trong <strong>1 giờ</strong>.
            </p>

            <!-- CTA Button -->
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#c62828;">
                  <a href="${resetUrl}"
                     style="display:inline-block;padding:14px 32px;color:#fff;font-weight:700;
                            font-size:14px;text-decoration:none;letter-spacing:0.5px;">
                    ĐẶT LẠI MẬT KHẨU
                  </a>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;color:#888;font-size:12px;line-height:1.6;">
              Nếu bạn không yêu cầu, hãy bỏ qua email này — mật khẩu sẽ không thay đổi.<br>
              Link sẽ hết hạn sau 1 giờ kể từ khi yêu cầu.
            </p>
            <p style="margin:12px 0 0;color:#aaa;font-size:11px;word-break:break-all;">
              ${resetUrl}
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f9f9;border-top:1px solid #eee;padding:16px 32px;">
            <p style="margin:0;color:#aaa;font-size:11px;">
              © 2026 Minhongo · Nền tảng học tiếng Nhật cho người Việt
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const info = (await transporter.sendMail({
      from: fromField,
      to,
      subject: '[Minhongo] Đặt lại mật khẩu của bạn',
      html,
      // Fallback text cho client không render HTML
      text: `Xin chào ${name || 'bạn'},\n\nĐặt lại mật khẩu tại: ${resetUrl}\n\nLink hết hạn sau 1 giờ.\n\n© 2026 Minhongo`,
    })) as { messageId: string };

    console.log(
      `[Mail] ✅ Đã gửi email tới ${to} — messageId: ${info.messageId}`,
    );
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
