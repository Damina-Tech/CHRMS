import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { permissionsForRole } from '../common/constants/permissions';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const userPublicSelect = {
  id: true,
  email: true,
  fullName: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userPublicSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: userPublicSelect,
      orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userPublicSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  /** Fixed CHRMS roles and their permission keys (for admin UI). */
  getRolesOverview() {
    return [
      {
        role: UserRole.ADMIN,
        label: 'Administrator',
        permissions: permissionsForRole(UserRole.ADMIN).map((p) => p as string),
      },
      {
        role: UserRole.HOUSING_OFFICER,
        label: 'Housing Officer',
        permissions: permissionsForRole(UserRole.HOUSING_OFFICER).map((p) => p as string),
      },
    ];
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        email: dto.email,
        fullName: dto.fullName,
        passwordHash,
        role: dto.role,
      },
      select: userPublicSelect,
    });
  }

  private async assertCanChangeAdminRole(userId: string, nextRole?: UserRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    if (user.role !== UserRole.ADMIN) return;
    if (nextRole === undefined || nextRole === UserRole.ADMIN) return;
    const adminCount = await this.prisma.user.count({ where: { role: UserRole.ADMIN } });
    if (adminCount <= 1) {
      throw new BadRequestException('Cannot change role of the last administrator');
    }
  }

  private async assertCanDeleteAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    if (user.role !== UserRole.ADMIN) return;
    const adminCount = await this.prisma.user.count({ where: { role: UserRole.ADMIN } });
    if (adminCount <= 1) {
      throw new BadRequestException('Cannot delete the last administrator');
    }
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    if (dto.role !== undefined) {
      await this.assertCanChangeAdminRole(id, dto.role);
    }
    if (dto.email !== undefined) {
      const taken = await this.prisma.user.findFirst({
        where: { email: dto.email, NOT: { id } },
      });
      if (taken) throw new ConflictException('Email already in use');
    }
    const data: {
      email?: string;
      fullName?: string;
      role?: UserRole;
      passwordHash?: string;
    } = {};
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.fullName !== undefined) data.fullName = dto.fullName;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.password !== undefined) {
      data.passwordHash = await bcrypt.hash(dto.password, 10);
    }
    if (Object.keys(data).length === 0) {
      return this.findOne(id);
    }
    return this.prisma.user.update({
      where: { id },
      data,
      select: userPublicSelect,
    });
  }

  async remove(id: string, actorId: string) {
    if (id === actorId) {
      throw new BadRequestException('You cannot delete your own account');
    }
    await this.findOne(id);
    await this.assertCanDeleteAdmin(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
