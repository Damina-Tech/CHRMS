import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';

@Injectable()
export class TenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const tenants = await this.prisma.tenant.findMany({
      orderBy: { fullName: 'asc' },
      include: {
        rentals: {
          where: { status: 'active' },
          take: 1,
          include: { property: true },
        },
      },
    });

    return tenants.map((t) => {
      const r = t.rentals[0];
      return {
        id: t.id,
        fullName: t.fullName,
        phone: t.phone,
        status: t.status,
        propertyCode: r?.property.code ?? null,
        propertyId: r?.property.id ?? null,
      };
    });
  }

  async findOne(id: string) {
    const t = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        rentals: { include: { property: true } },
        purchases: { include: { property: true } },
      },
    });
    if (!t) throw new NotFoundException('Tenant not found');
    return t;
  }

  async create(dto: CreateTenantDto) {
    try {
      return await this.prisma.tenant.create({
        data: {
          fullName: dto.fullName,
          gender: dto.gender,
          phone: dto.phone,
          nationalId: dto.nationalId,
          familySize: dto.familySize,
          status: dto.status ?? 'active',
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('National ID already registered');
      }
      throw e;
    }
  }
}
