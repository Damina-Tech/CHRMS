import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Permission } from '../common/constants/permissions';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateRentalPaymentDto } from './dto/create-rental-payment.dto';
import { RentalPaymentsService } from './rental-payments.service';

@Controller('rental-payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RentalPaymentsController {
  constructor(private readonly payments: RentalPaymentsService) {}

  @Get()
  @RequirePermissions(Permission.RENTAL_PAYMENTS_READ)
  findAll(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('rentalId') rentalId?: string,
  ) {
    return this.payments.findAll({ from, to, rentalId });
  }

  @Post()
  @RequirePermissions(Permission.RENTAL_PAYMENTS_WRITE)
  create(@Body() dto: CreateRentalPaymentDto) {
    return this.payments.create(dto);
  }
}
