import {
  IsDateString,
  IsInt,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class CreateSaleDto {
  @IsString()
  propertyId: string;

  @IsString()
  buyerId: string;

  @IsNumber()
  @Min(0)
  totalPrice: number;

  @IsNumber()
  @Min(0)
  downPayment: number;

  @IsInt()
  @Min(1)
  durationMonths: number;

  @IsDateString()
  startDate: string;
}
