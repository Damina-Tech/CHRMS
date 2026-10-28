import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  fullName: string;

  @IsString()
  gender: string;

  @IsString()
  phone: string;

  @IsOptional()
  @IsString()
  nationalId?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsInt()
  @Min(0)
  familySize: number;

  @IsOptional()
  @IsString()
  status?: string;
}
