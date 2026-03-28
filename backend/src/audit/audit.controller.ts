import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('audit')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('logs')
  @RequirePermissions(Permission.AUDIT_READ)
  logs(@Query('take') take?: string) {
    const n = Math.min(200, Math.max(1, Number(take) || 50));
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: n,
    });
  }
}
