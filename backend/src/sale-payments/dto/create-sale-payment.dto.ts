import { IsDateString, IsNumber, IsString, Min } from 'class-validator';

export class CreateSalePaymentDto {
  @IsString()
  saleId: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  paidAt: string;

  @IsString()
  method: string;
}
