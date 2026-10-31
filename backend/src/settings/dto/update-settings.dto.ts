import { IsInt, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  /** Global day of month rent is due for every active rental (1–28) */
  @IsInt()
  @Min(1)
  @Max(28)
  rentalDueDay: number;
}
