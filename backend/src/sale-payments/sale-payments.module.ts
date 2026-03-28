import { Module } from '@nestjs/common';
import { SalePaymentsController } from './sale-payments.controller';
import { SalePaymentsService } from './sale-payments.service';

@Module({
  controllers: [SalePaymentsController],
  providers: [SalePaymentsService],
})
export class SalePaymentsModule {}
