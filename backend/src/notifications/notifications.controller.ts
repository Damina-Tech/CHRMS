import { Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @RequirePermissions(Permission.DASHBOARD_READ)
  list() {
    return this.notifications.list();
  }

  @Patch('read-all')
  @RequirePermissions(Permission.DASHBOARD_READ)
  markAllRead() {
    return this.notifications.markAllRead();
  }

  @Patch(':id/read')
  @RequirePermissions(Permission.DASHBOARD_READ)
  markRead(@Param('id') id: string) {
    return this.notifications.markRead(id);
  }
}
