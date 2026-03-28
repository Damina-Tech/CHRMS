import { Module } from '@nestjs/common';
import { RentalPaymentsController } from './rental-payments.controller';
import { RentalPaymentsService } from './rental-payments.service';

@Module({
  controllers: [RentalPaymentsController],
  providers: [RentalPaymentsService],
})
export class RentalPaymentsModule {}
