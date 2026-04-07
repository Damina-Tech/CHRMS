import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateTenantDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  familySize?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
