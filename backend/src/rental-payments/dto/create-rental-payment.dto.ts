import { IsDateString, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateRentalPaymentDto {
  @IsString()
  rentalId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  paidAt: string;

  @IsString()
  method: string;

  @IsOptional()
  @IsString()
  receiptNo?: string;
}
