import { PropertyStatus, PropertyType } from '@prisma/client';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePropertyDto {
  @IsString()
  code: string;

  @IsEnum(PropertyType)
  type: PropertyType;

  @IsString()
  woreda: string;

  @IsString()
  kebele: string;

  @IsString()
  houseNumber: string;

  @IsInt()
  @Min(0)
  rooms: number;

  @IsNumber()
  @Min(0)
  area: number;

  @IsString()
  condition: string;

  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}
