import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { authConfig } from './auth.config';
import { LoginDto } from './dto/login.dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}
  @Get('config')
  settings() {
    const { mode, url, realm, clientId } = authConfig(this.config);
    return { mode, url, realm, clientId };
  }
  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() request: { user: { sub: string; email: string; fullName: string; role: string } }) {
    const { sub, ...profile } = request.user;
    return { id: sub, ...profile };
  }
  @Post('login')
  login(@Body() dto: LoginDto) { return this.auth.login(dto.email, dto.password); }
}
