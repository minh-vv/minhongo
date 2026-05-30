import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

/** Khóa lưu trong DB (snake_case) */
export const SYSTEM_SETTING_KEYS = {
  ALLOW_REGISTRATION: 'allow_registration',
  MAINTENANCE_MODE: 'maintenance_mode',
  ANNOUNCEMENT_MESSAGE: 'announcement_message',
  GUEST_DEMO_CARDS: 'guest_demo_cards',
} as const;

const DEFAULTS: Record<string, string> = {
  [SYSTEM_SETTING_KEYS.ALLOW_REGISTRATION]: 'true',
  [SYSTEM_SETTING_KEYS.MAINTENANCE_MODE]: 'false',
  [SYSTEM_SETTING_KEYS.ANNOUNCEMENT_MESSAGE]: '',
  [SYSTEM_SETTING_KEYS.GUEST_DEMO_CARDS]: '5',
};

export interface PublicSystemConfig {
  allowRegistration: boolean;
  maintenanceMode: boolean;
  announcementMessage: string;
  guestDemoCards: number;
}

@Injectable()
export class SystemConfigService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.ensureDefaults();
  }

  /** Tạo bản ghi mặc định nếu chưa có (không ghi đè giá trị hiện có). */
  private async ensureDefaults() {
    await this.prisma.systemSetting.createMany({
      data: Object.entries(DEFAULTS).map(([key, value]) => ({ key, value })),
      skipDuplicates: true,
    });
  }

  private parseBool(raw: string | undefined, fallback: boolean): boolean {
    if (raw === undefined || raw === null) return fallback;
    return raw === 'true' || raw === '1';
  }

  private parseIntSafe(
    raw: string | undefined,
    fallback: number,
    min: number,
    max: number,
  ): number {
    const n = parseInt(raw ?? '', 10);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  async getRaw(key: string): Promise<string | null> {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    return row?.value ?? DEFAULTS[key] ?? null;
  }

  /** Dùng trong AuthService — trả về true nếu cho phép đăng ký mới */
  async isRegistrationAllowed(): Promise<boolean> {
    const v = await this.getRaw(SYSTEM_SETTING_KEYS.ALLOW_REGISTRATION);
    return this.parseBool(v ?? undefined, true);
  }

  async getPublicConfig(): Promise<PublicSystemConfig> {
    const [allow, maint, ann, demo] = await Promise.all([
      this.getRaw(SYSTEM_SETTING_KEYS.ALLOW_REGISTRATION),
      this.getRaw(SYSTEM_SETTING_KEYS.MAINTENANCE_MODE),
      this.getRaw(SYSTEM_SETTING_KEYS.ANNOUNCEMENT_MESSAGE),
      this.getRaw(SYSTEM_SETTING_KEYS.GUEST_DEMO_CARDS),
    ]);

    return {
      allowRegistration: this.parseBool(allow ?? undefined, true),
      maintenanceMode: this.parseBool(maint ?? undefined, false),
      announcementMessage: ann ?? '',
      guestDemoCards: this.parseIntSafe(demo ?? undefined, 5, 1, 50),
    };
  }

  /** Admin: toàn bộ cặp key–value (chỉ các khóa đã định nghĩa) */
  async getAllSettings(): Promise<Record<string, string>> {
    const keys = Object.values(SYSTEM_SETTING_KEYS);
    const rows = await this.prisma.systemSetting.findMany({
      where: { key: { in: keys } },
    });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
    const out: Record<string, string> = {};
    for (const k of keys) {
      out[k] = map[k] ?? DEFAULTS[k] ?? '';
    }
    return out;
  }

  /**
   * Admin: cập nhật một phần cấu hình.
   * Body camelCase được map sang khóa DB.
   */
  async patchSettings(patch: {
    allowRegistration?: boolean;
    maintenanceMode?: boolean;
    announcementMessage?: string;
    guestDemoCards?: number;
  }): Promise<PublicSystemConfig> {
    const updates: { key: string; value: string }[] = [];

    if (patch.allowRegistration !== undefined) {
      updates.push({
        key: SYSTEM_SETTING_KEYS.ALLOW_REGISTRATION,
        value: patch.allowRegistration ? 'true' : 'false',
      });
    }
    if (patch.maintenanceMode !== undefined) {
      updates.push({
        key: SYSTEM_SETTING_KEYS.MAINTENANCE_MODE,
        value: patch.maintenanceMode ? 'true' : 'false',
      });
    }
    if (patch.announcementMessage !== undefined) {
      const msg = patch.announcementMessage.trim();
      if (msg.length > 500) {
        throw new BadRequestException('Thông báo tối đa 500 ký tự');
      }
      updates.push({
        key: SYSTEM_SETTING_KEYS.ANNOUNCEMENT_MESSAGE,
        value: msg,
      });
    }
    if (patch.guestDemoCards !== undefined) {
      const n = patch.guestDemoCards;
      if (!Number.isInteger(n) || n < 1 || n > 50) {
        throw new BadRequestException('Số thẻ demo cho khách phải từ 1 đến 50');
      }
      updates.push({
        key: SYSTEM_SETTING_KEYS.GUEST_DEMO_CARDS,
        value: String(n),
      });
    }

    for (const u of updates) {
      await this.prisma.systemSetting.upsert({
        where: { key: u.key },
        create: { key: u.key, value: u.value },
        update: { value: u.value },
      });
    }

    return this.getPublicConfig();
  }
}
