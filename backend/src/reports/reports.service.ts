import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardService } from '../dashboard/dashboard.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly dashboard: DashboardService,
  ) {}

  /** Reuses dashboard aggregates for a printable / API summary */
  async summary() {
    const dash = await this.dashboard.getSummary();
    return {
      generatedAt: new Date().toISOString(),
      ...dash,
    };
  }
}
