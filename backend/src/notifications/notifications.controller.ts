import { Controller, Get, UseGuards } from '@nestjs/common';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  /** Placeholder until notification delivery is wired */
  @Get()
  @RequirePermissions(Permission.DASHBOARD_READ)
  list() {
    return { items: [] as { id: string; message: string; read: boolean; createdAt: string }[] };
  }
}
