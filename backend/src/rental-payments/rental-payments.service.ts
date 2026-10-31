import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  paginated,
  parsePagination,
  PaginationQuery,
} from '../common/pagination';
import { PrismaService } from '../prisma/prisma.service';
import { paidInMonth } from '../rentals/rental-overdue.util';
import { CreateRentalPaymentDto } from './dto/create-rental-payment.dto';

@Injectable()
export class RentalPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    filters: PaginationQuery & { from?: string; to?: string; rentalId?: string },
  ) {
    const { page, pageSize, skip, take } = parsePagination(filters);
    const where: Prisma.RentalPaymentWhereInput = {};
    if (filters.rentalId) where.rentalId = filters.rentalId;
    if (filters.from || filters.to) {
      where.paidAt = {};
      if (filters.from) where.paidAt.gte = new Date(filters.from);
      if (filters.to) where.paidAt.lte = new Date(filters.to);
    }

    const [items, total] = await Promise.all([
      this.prisma.rentalPayment.findMany({
        where,
        orderBy: [{ paidAt: 'desc' }, { createdAt: 'desc' }],
        skip,
        take,
        include: {
          rental: {
            include: {
              property: { select: { code: true } },
              tenant: { select: { fullName: true } },
            },
          },
        },
      }),
      this.prisma.rentalPayment.count({ where }),
    ]);

    return paginated(items, total, page, pageSize);
  }

  async create(dto: CreateRentalPaymentDto) {
    const rental = await this.prisma.rental.findUnique({
      where: { id: dto.rentalId },
      include: { payments: true },
    });
    if (!rental) throw new NotFoundException('Rental not found');
    if (rental.status !== 'active') {
      throw new BadRequestException('Can only record payments on active rentals');
    }
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }

    const paidAt = new Date(dto.paidAt);
    const y = paidAt.getFullYear();
    const m = paidAt.getMonth();
    const monthlyRent = Number(rental.monthlyRent);
    const alreadyPaid = paidInMonth(rental.payments, y, m);
    const remaining = Math.round((monthlyRent - alreadyPaid) * 100) / 100;

    if (remaining <= 0) {
      throw new BadRequestException(
        'This month’s rent is already fully paid',
      );
    }
    if (dto.amount > remaining) {
      throw new BadRequestException(
        `Amount exceeds remaining rent for this month (ETB ${remaining.toLocaleString()} left)`,
      );
    }

    return this.prisma.rentalPayment.create({
      data: {
        rentalId: dto.rentalId,
        amount: dto.amount,
        paidAt,
        method: dto.method,
        receiptNo: dto.receiptNo,
      },
    });
  }
}
