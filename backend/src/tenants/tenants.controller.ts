import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { TenantsService } from './tenants.service';

@Controller('tenants')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TenantsController {
  constructor(private readonly tenants: TenantsService) {}

  @Get()
  @RequirePermissions(Permission.TENANTS_READ)
  findAll() {
    return this.tenants.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permission.TENANTS_READ)
  findOne(@Param('id') id: string) {
    return this.tenants.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.TENANTS_WRITE)
  create(@Body() dto: CreateTenantDto) {
    return this.tenants.create(dto);
  }
}
