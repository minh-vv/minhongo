import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Health check endpoint — used by Docker healthcheck, load balancers, and
 * monitoring dashboards to verify the application is running and its
 * dependencies (database) are reachable.
 */
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const start = Date.now();

    // Verify database connectivity
    let dbStatus: 'up' | 'down' = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      dbStatus = 'down';
    }

    const uptime = process.uptime();
    const responseTimeMs = Date.now() - start;

    const status = dbStatus === 'up' ? 'ok' : 'degraded';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      responseTimeMs,
      checks: {
        database: dbStatus,
      },
    };
  }
}
