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
import {
  SECURITY_DEPOSIT_METHOD,
  isSecurityDepositPayment,
} from '../rentals/rental-payment.constants';
import {
  getMonthCoverageStatus,
  paidInMonth,
} from '../rentals/rental-overdue.util';
import { CreateRentalPaymentDto } from './dto/create-rental-payment.dto';

const RENT_METHODS = new Set(['cash', 'bank', 'mobile', 'other']);

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

    const [rows, total] = await Promise.all([
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
              payments: true,
            },
          },
        },
      }),
      this.prisma.rentalPayment.count({ where }),
    ]);

    const items = rows.map((p) => {
      const isDeposit = isSecurityDepositPayment(p.method);
      const y = p.paidAt.getFullYear();
      const m = p.paidAt.getMonth();
      const monthlyRent = Number(p.rental.monthlyRent);
      const monthStatus = isDeposit
        ? null
        : getMonthCoverageStatus(monthlyRent, p.rental.payments, y, m);
      const paidForMonth = isDeposit
        ? null
        : paidInMonth(p.rental.payments, y, m);
      const balanceDue =
        paidForMonth == null
          ? null
          : Math.max(0, Math.round((monthlyRent - paidForMonth) * 100) / 100);
      return {
        id: p.id,
        amount: p.amount,
        paidAt: p.paidAt,
        method: p.method,
        receiptNo: p.receiptNo,
        createdAt: p.createdAt,
        kind: isDeposit ? ('deposit' as const) : ('rent' as const),
        monthStatus,
        balanceDue,
        rental: {
          id: p.rental.id,
          monthlyRent,
          property: p.rental.property,
          tenant: p.rental.tenant,
        },
      };
    });

    return paginated(items, total, page, pageSize);
  }

  async create(dto: CreateRentalPaymentDto) {
    const rental = await this.prisma.rental.findUnique({
      where: { id: dto.rentalId },
      include: { payments: true },
    });
    if (!rental) throw new NotFoundException('Rental not found');
    if (rental.status !== 'active') {
      throw new BadRequestException(
        'Can only record rent payments on active rentals',
      );
    }
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be greater than zero');
    }
    if (dto.method === SECURITY_DEPOSIT_METHOD) {
      throw new BadRequestException(
        'Security deposit is set on the rental, not as a rent payment',
      );
    }
    if (!RENT_METHODS.has(dto.method)) {
      throw new BadRequestException(
        'Invalid payment method. Use: cash, bank, mobile, or other',
      );
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

    const created = await this.prisma.rentalPayment.create({
      data: {
        rentalId: dto.rentalId,
        amount: dto.amount,
        paidAt,
        method: dto.method,
        receiptNo: dto.receiptNo,
      },
    });

    const monthStatus = getMonthCoverageStatus(
      monthlyRent,
      [...rental.payments, created],
      y,
      m,
    );

    return {
      ...created,
      kind: 'rent' as const,
      monthStatus,
    };
  }
}
