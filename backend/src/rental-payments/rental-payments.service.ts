import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRentalPaymentDto } from './dto/create-rental-payment.dto';

@Injectable()
export class RentalPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: { from?: string; to?: string; rentalId?: string }) {
    const where: Prisma.RentalPaymentWhereInput = {};
    if (filters.rentalId) where.rentalId = filters.rentalId;
    if (filters.from || filters.to) {
      where.paidAt = {};
      if (filters.from) where.paidAt.gte = new Date(filters.from);
      if (filters.to) where.paidAt.lte = new Date(filters.to);
    }

    return this.prisma.rentalPayment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      include: {
        rental: {
          include: { property: { select: { code: true } }, tenant: { select: { fullName: true } } },
        },
      },
    });
  }

  async create(dto: CreateRentalPaymentDto) {
    const rental = await this.prisma.rental.findUnique({ where: { id: dto.rentalId } });
    if (!rental) throw new NotFoundException('Rental not found');

    return this.prisma.rentalPayment.create({
      data: {
        rentalId: dto.rentalId,
        amount: dto.amount,
        paidAt: new Date(dto.paidAt),
        method: dto.method,
        receiptNo: dto.receiptNo,
      },
    });
  }
}
