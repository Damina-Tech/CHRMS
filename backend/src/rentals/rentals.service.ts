import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PropertyStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { isRentalOverdue } from './rental-overdue.util';
import { CreateRentalDto } from './dto/create-rental.dto';
import { UpdateRentalDto } from './dto/update-rental.dto';

@Injectable()
export class RentalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const rows = await this.prisma.rental.findMany({
      orderBy: { startDate: 'desc' },
      include: {
        tenant: true,
        property: true,
        payments: true,
      },
    });

    return rows.map((r) => ({
      id: r.id,
      status: r.status,
      startDate: r.startDate,
      endDate: r.endDate,
      monthlyRent: Number(r.monthlyRent),
      dueDay: r.dueDay,
      deposit: r.deposit ? Number(r.deposit) : null,
      tenant: { id: r.tenant.id, fullName: r.tenant.fullName, phone: r.tenant.phone },
      property: {
        id: r.property.id,
        code: r.property.code,
        woreda: r.property.woreda,
        kebele: r.property.kebele,
      },
      overdue:
        r.status === 'active'
          ? isRentalOverdue(r.dueDay, r.monthlyRent, r.payments)
          : false,
    }));
  }

  async findOne(id: string) {
    const r = await this.prisma.rental.findUnique({
      where: { id },
      include: { tenant: true, property: true, payments: { orderBy: { paidAt: 'desc' } } },
    });
    if (!r) throw new NotFoundException('Rental not found');
    const overdue =
      r.status === 'active'
        ? isRentalOverdue(r.dueDay, r.monthlyRent, r.payments)
        : false;
    return { ...r, monthlyRent: Number(r.monthlyRent), overdue };
  }

  async create(dto: CreateRentalDto) {
    const property = await this.prisma.property.findUnique({
      where: { id: dto.propertyId },
      include: { rentals: { where: { status: 'active' } } },
    });
    if (!property) throw new NotFoundException('Property not found');
    if (property.status !== PropertyStatus.available) {
      throw new BadRequestException('Property is not available for rent');
    }
    if (property.rentals.length > 0) {
      throw new BadRequestException('Property already has an active rental');
    }

    const tenant = await this.prisma.tenant.findUnique({ where: { id: dto.tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found');

    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.create({
        data: {
          propertyId: dto.propertyId,
          tenantId: dto.tenantId,
          startDate: new Date(dto.startDate),
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          monthlyRent: dto.monthlyRent,
          dueDay: dto.dueDay,
          deposit: dto.deposit ?? null,
          status: 'active',
        },
      });
      await tx.property.update({
        where: { id: dto.propertyId },
        data: { status: PropertyStatus.rented },
      });
      return rental;
    });
  }

  async update(id: string, dto: UpdateRentalDto) {
    const data: Prisma.RentalUpdateInput = {};
    if (dto.startDate !== undefined) data.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) data.endDate = new Date(dto.endDate);
    if (dto.monthlyRent !== undefined) data.monthlyRent = dto.monthlyRent;
    if (dto.dueDay !== undefined) data.dueDay = dto.dueDay;
    if (dto.deposit !== undefined) data.deposit = dto.deposit;
    if (dto.status !== undefined) data.status = dto.status;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const existing = await tx.rental.findUnique({
          where: { id },
          select: { id: true, propertyId: true, status: true },
        });
        if (!existing) throw new NotFoundException('Rental not found');

        const rental = await tx.rental.update({
          where: { id },
          data,
        });

        const nextStatus = dto.status ?? existing.status;
        if (existing.status !== nextStatus) {
          await tx.property.update({
            where: { id: existing.propertyId },
            data: {
              status:
                nextStatus === 'active' ? PropertyStatus.rented : PropertyStatus.available,
            },
          });
        }

        return rental;
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException('Rental not found');
      }
      throw e;
    }
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      const rental = await tx.rental.findUnique({
        where: { id },
        select: { id: true, propertyId: true },
      });
      if (!rental) throw new NotFoundException('Rental not found');

      const deleted = await tx.rental.delete({ where: { id } });
      await tx.property.update({
        where: { id: rental.propertyId },
        data: { status: PropertyStatus.available },
      });
      return deleted;
    });
  }
}
