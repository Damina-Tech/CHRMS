import { Controller, Get, UseGuards } from '@nestjs/common';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('summary')
  @RequirePermissions(Permission.DASHBOARD_READ)
  summary() {
    return this.dashboard.getSummary();
  }

  @Get('trends')
  @RequirePermissions(Permission.DASHBOARD_READ)
  trends() {
    return this.dashboard.getTrends();
  }
}
