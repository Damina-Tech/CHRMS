import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { saleTotals } from '../sales/sale-calculations.util';
import { CreateSalePaymentDto } from './dto/create-sale-payment.dto';

@Injectable()
export class SalePaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters: { from?: string; to?: string; saleId?: string }) {
    const where: Prisma.SalePaymentWhereInput = {};
    if (filters.saleId) where.saleId = filters.saleId;
    if (filters.from || filters.to) {
      where.paidAt = {};
      if (filters.from) where.paidAt.gte = new Date(filters.from);
      if (filters.to) where.paidAt.lte = new Date(filters.to);
    }

    return this.prisma.salePayment.findMany({
      where,
      orderBy: { paidAt: 'desc' },
      include: {
        sale: {
          include: {
            property: { select: { code: true } },
            buyer: { select: { fullName: true } },
          },
        },
      },
    });
  }

  async create(dto: CreateSalePaymentDto) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: dto.saleId },
      include: { payments: true },
    });
    if (!sale) throw new NotFoundException('Sale not found');

    const payment = await this.prisma.salePayment.create({
      data: {
        saleId: dto.saleId,
        amount: dto.amount,
        paidAt: new Date(dto.paidAt),
        method: dto.method,
      },
    });

    const updated = await this.prisma.sale.findUnique({
      where: { id: dto.saleId },
      include: { payments: true },
    });
    if (updated) {
      const m = saleTotals(updated.totalPrice, updated.payments);
      if (m.isCompleted && updated.status !== 'completed') {
        await this.prisma.sale.update({
          where: { id: dto.saleId },
          data: { status: 'completed' },
        });
      }
    }

    return payment;
  }
}
