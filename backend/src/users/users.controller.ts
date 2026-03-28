import { Controller, Get, UseGuards } from '@nestjs/common';
import { Permission } from '../common/constants/permissions';
import {
  CurrentUser,
  JwtUserPayload,
} from '../common/decorators/current-user.decorator';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
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
}
