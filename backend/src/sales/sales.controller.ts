import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';

@Controller('sales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get()
  @RequirePermissions(Permission.SALES_READ)
  findAll() {
    return this.sales.findAll();
  }

  @Get(':id')
  @RequirePermissions(Permission.SALES_READ)
  findOne(@Param('id') id: string) {
    return this.sales.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.SALES_WRITE)
  create(@Body() dto: CreateSaleDto) {
    return this.sales.create(dto);
  }
}
