import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';
import { SalePaymentsService } from './sale-payments.service';

@Controller('sale-payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalePaymentsController {
  constructor(private readonly payments: SalePaymentsService) {}

  @Get()
  @RequirePermissions(Permission.SALE_PAYMENTS_READ)
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('saleId') saleId?: string,
  ) {
    return this.payments.findAll({ from, to, saleId });
  }

  @Post()
  @RequirePermissions(Permission.SALE_PAYMENTS_WRITE)
  create(@Body() dto: CreateSalePaymentDto) {
    return this.payments.create(dto);
  }
}
