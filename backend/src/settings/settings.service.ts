import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';

const DEFAULT_ID = 'default';
const REMINDER_DAYS_BEFORE = 5;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    const row = await this.prisma.appSetting.upsert({
      where: { id: DEFAULT_ID },
      update: {},
      create: {
        id: DEFAULT_ID,
        rentalDueDay: 5,
        reminderDaysBefore: REMINDER_DAYS_BEFORE,
      },
    });
    return {
      rentalDueDay: row.rentalDueDay,
      reminderDaysBefore: row.reminderDaysBefore,
      updatedAt: row.updatedAt,
    };
  }

  async update(dto: UpdateSettingsDto) {
    const row = await this.prisma.appSetting.upsert({
      where: { id: DEFAULT_ID },
      update: {
        rentalDueDay: dto.rentalDueDay,
        reminderDaysBefore: REMINDER_DAYS_BEFORE,
      },
      create: {
        id: DEFAULT_ID,
        rentalDueDay: dto.rentalDueDay,
        reminderDaysBefore: REMINDER_DAYS_BEFORE,
      },
    });
    return {
      rentalDueDay: row.rentalDueDay,
      reminderDaysBefore: row.reminderDaysBefore,
      updatedAt: row.updatedAt,
    };
  }
}
