import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PropertyStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { saleTotals } from '../sales/sale-calculations.util';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params: { q?: string; status?: PropertyStatus; woreda?: string }) {
    const where: Prisma.PropertyWhereInput = {};
    if (params.status) where.status = params.status;
    if (params.woreda) where.woreda = params.woreda;
    if (params.q?.trim()) {
      const q = params.q.trim();
      where.OR = [
        { code: { contains: q, mode: 'insensitive' } },
        { woreda: { contains: q, mode: 'insensitive' } },
        { kebele: { contains: q, mode: 'insensitive' } },
        { houseNumber: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await this.prisma.property.findMany({
      where,
      orderBy: { code: 'asc' },
      include: {
        rentals: {
          where: { status: 'active' },
          take: 1,
          include: { tenant: true },
        },
        sales: {
          where: { status: { not: 'cancelled' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { buyer: true },
        },
      },
    });

    return rows.map((p) => {
      const activeRental = p.rentals[0];
      const latestSale = p.sales[0];
      let assignee: string | null = null;
      if (activeRental) assignee = activeRental.tenant.fullName;
      else if (latestSale) assignee = latestSale.buyer.fullName;
      const location = `Woreda ${p.woreda}, Kebele ${p.kebele}, #${p.houseNumber}`;
      return {
        id: p.id,
        code: p.code,
        location,
        type: p.type,
        status: p.status,
        assignee,
        woreda: p.woreda,
        kebele: p.kebele,
        houseNumber: p.houseNumber,
      };
    });
  }

  async findOne(id: string) {
    const p = await this.prisma.property.findUnique({
      where: { id },
      include: {
        rentals: {
          where: { status: 'active' },
          include: { tenant: true, payments: true },
        },
        sales: {
          where: { status: { not: 'cancelled' } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { buyer: true, payments: true },
        },
      },
    });
    if (!p) throw new NotFoundException('Property not found');

    const activeRental = p.rentals[0];
    const sale = p.sales[0];

    let paymentSummary: {
      context: 'rental' | 'sale' | null;
      total: number;
      paid: number;
      remaining: number;
      completionPercentage: number;
    } = {
      context: null,
      total: 0,
      paid: 0,
      remaining: 0,
      completionPercentage: 0,
    };

    if (sale) {
      const t = saleTotals(sale.totalPrice, sale.payments);
      paymentSummary = {
        context: 'sale',
        total: t.totalPrice,
        paid: t.totalPaid,
        remaining: t.remaining,
        completionPercentage: t.completionPercentage,
      };
    } else if (activeRental) {
      const paid = activeRental.payments.reduce((s, x) => s + Number(x.amount), 0);
      paymentSummary = {
        context: 'rental',
        total: 0,
        paid,
        remaining: 0,
        completionPercentage: 0,
      };
    }

    return {
      property: {
        id: p.id,
        code: p.code,
        type: p.type,
        woreda: p.woreda,
        kebele: p.kebele,
        houseNumber: p.houseNumber,
        rooms: p.rooms,
        area: Number(p.area),
        condition: p.condition,
        status: p.status,
      },
      tenant: activeRental
        ? {
            id: activeRental.tenant.id,
            fullName: activeRental.tenant.fullName,
            phone: activeRental.tenant.phone,
            rental: {
              id: activeRental.id,
              startDate: activeRental.startDate,
              endDate: activeRental.endDate,
              monthlyRent: Number(activeRental.monthlyRent),
              dueDay: activeRental.dueDay,
              deposit: activeRental.deposit ? Number(activeRental.deposit) : null,
              status: activeRental.status,
            },
          }
        : null,
      sale: sale
        ? (() => {
            const m = saleTotals(sale.totalPrice, sale.payments);
            return {
              id: sale.id,
              buyer: {
                id: sale.buyer.id,
                fullName: sale.buyer.fullName,
                phone: sale.buyer.phone,
              },
              totalPrice: m.totalPrice,
              downPayment: Number(sale.downPayment),
              durationMonths: sale.durationMonths,
              startDate: sale.startDate,
              status: sale.status,
              totalPaid: m.totalPaid,
              remaining: m.remaining,
              completionPercentage: m.completionPercentage,
              isCompleted: m.isCompleted,
            };
          })()
        : null,
      paymentSummary,
    };
  }

  async create(dto: CreatePropertyDto) {
    try {
      return await this.prisma.property.create({
        data: {
          code: dto.code,
          type: dto.type,
          woreda: dto.woreda,
          kebele: dto.kebele,
          houseNumber: dto.houseNumber,
          rooms: dto.rooms,
          area: dto.area,
          condition: dto.condition,
          status: dto.status ?? PropertyStatus.available,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Property code already exists');
      }
      throw e;
    }
  }

  async update(id: string, dto: UpdatePropertyDto) {
    const data: Prisma.PropertyUpdateInput = {};
    if (dto.code !== undefined) data.code = dto.code;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.woreda !== undefined) data.woreda = dto.woreda;
    if (dto.kebele !== undefined) data.kebele = dto.kebele;
    if (dto.houseNumber !== undefined) data.houseNumber = dto.houseNumber;
    if (dto.rooms !== undefined) data.rooms = dto.rooms;
    if (dto.area !== undefined) data.area = dto.area;
    if (dto.condition !== undefined) data.condition = dto.condition;
    if (dto.status !== undefined) data.status = dto.status;

    try {
      return await this.prisma.property.update({
        where: { id },
        data,
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Property not found');
      }
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Property code already exists');
      }
      throw e;
    }
  }
}
