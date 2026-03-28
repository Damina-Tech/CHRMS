import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRentalDto {
  @IsString()
  propertyId: string;

  @IsString()
  tenantId: string;

  @IsDateString()
  startDate: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsNumber()
  @Min(0)
  monthlyRent: number;

  /** Day of month rent is due (1–28 recommended) */
  @IsInt()
  @Min(1)
  @Max(28)
  dueDay: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  deposit?: number;
}
