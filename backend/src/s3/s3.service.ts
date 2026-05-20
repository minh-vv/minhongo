import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  DeleteObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    this.region = process.env.AWS_REGION ?? 'ap-southeast-1';
    this.bucket = process.env.AWS_S3_BUCKET ?? '';

    this.client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? '',
      },
    });
  }

  /**
   * Upload một buffer lên S3.
   * @param key   Đường dẫn object trong bucket, VD: "avatars/userId.jpg"
   * @param body  Buffer nội dung file
   * @param mime  MIME type, VD: "image/jpeg"
   * @returns     URL công khai của object
   */
  async upload(key: string, body: Buffer, mime: string): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: mime,
        // Bỏ ACL nếu bucket dùng Block Public Access + Bucket Policy
        // ACL: 'public-read',
      }),
    );

    const customDomain = process.env.AWS_S3_CUSTOM_DOMAIN;
    if (customDomain) {
      return `https://${customDomain}/${key}`;
    }
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Xóa object khỏi S3 theo key.
   * Bỏ qua lỗi nếu object không tồn tại.
   */
  async delete(key: string): Promise<void> {
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      this.logger.warn(`Không thể xóa S3 object "${key}": ${String(err)}`);
    }
  }

  /**
   * Trích xuất S3 key từ URL đầy đủ.
   * VD: "https://bucket.s3.region.amazonaws.com/avatars/abc.jpg" → "avatars/abc.jpg"
   */
  extractKey(url: string): string | null {
    try {
      const customDomain = process.env.AWS_S3_CUSTOM_DOMAIN;
      if (customDomain && url.includes(customDomain)) {
        return url.split(`${customDomain}/`)[1] ?? null;
      }
      // URL chuẩn: https://bucket.s3.region.amazonaws.com/key
      const urlObj = new URL(url);
      // pathname bắt đầu bằng '/', bỏ ký tự đầu
      return urlObj.pathname.slice(1) || null;
    } catch {
      return null;
    }
  }
}
