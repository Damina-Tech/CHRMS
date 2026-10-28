import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Permission } from '../common/constants/permissions';
import {
  CurrentUser,
  JwtUserPayload,
} from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @RequirePermissions(Permission.PROFILE_READ)
  me(@CurrentUser() jwt: JwtUserPayload) {
    return this.users.getProfile(jwt.sub);
  }

  @Get('roles/overview')
  @RequirePermissions(Permission.USERS_READ)
  rolesOverview() {
    return this.users.getRolesOverview();
  }

  @Get()
  @RequirePermissions(Permission.USERS_READ)
  findAll(
    @Query('q') q?: string,
    @Query('role') role?: UserRole,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.users.findAll({ q, role, page, pageSize });
  }

  @Get(':id')
  @RequirePermissions(Permission.USERS_READ)
  findOne(@Param('id') id: string) {
    return this.users.findOne(id);
  }

  @Post()
  @RequirePermissions(Permission.USERS_WRITE)
  create(@Body() dto: CreateUserDto) {
    return this.users.create(dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.USERS_WRITE)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.users.update(id, dto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.USERS_WRITE)
  remove(@Param('id') id: string, @CurrentUser() jwt: JwtUserPayload) {
    return this.users.remove(id, jwt.sub);
  }
}
