import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { authConfig } from './auth.config';

export type KeycloakPayload = {
  sub?: string;
  exp?: number;
  typ?: string;
  azp?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  preferred_username?: string;
  resource_access?: Record<string, { roles?: string[] }>;
};

@Injectable()
export class KeycloakUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async resolve(payload: KeycloakPayload) {
    const settings = authConfig(this.config);
    if (
      typeof payload.sub !== 'string' ||
      !payload.sub ||
      !Number.isFinite(payload.exp) ||
      payload.typ !== 'Bearer' ||
      payload.azp !== settings.clientId
    ) {
      throw new UnauthorizedException('Invalid Chiro Auth access token.');
    }
    const roles = payload.resource_access?.[settings.audience]?.roles ?? [];
    if (!Array.isArray(roles))
      throw new UnauthorizedException('Invalid role claims.');
    const role = roles.includes(UserRole.ADMIN)
      ? UserRole.ADMIN
      : roles.includes(UserRole.HOUSING_OFFICER)
        ? UserRole.HOUSING_OFFICER
        : null;
    if (!role)
      throw new ForbiddenException(
        'Your account has not been granted access to CHRMS.',
      );
    if (
      typeof payload.email !== 'string' ||
      !payload.email ||
      payload.email_verified !== true
    ) {
      throw new ForbiddenException(
        'Verify your email address in Chiro Auth before accessing CHRMS.',
      );
    }
    const existing = await this.prisma.user.findUnique({
      where: { keycloakSub: payload.sub },
    });
    if (existing && existing.keycloakIssuer !== settings.issuer) {
      throw new ForbiddenException(
        'This CHRMS account is linked to another identity provider.',
      );
    }
    if (
      !existing &&
      (await this.prisma.user.findUnique({
        where: { email: payload.email.toLowerCase() },
      }))
    ) {
      throw new ForbiddenException(
        'A CHRMS account already uses this email. Ask your administrator to link it to Chiro Auth.',
      );
    }
    const name =
      typeof payload.name === 'string' && payload.name
        ? payload.name
        : undefined;
    const username =
      typeof payload.preferred_username === 'string'
        ? payload.preferred_username
        : undefined;
    try {
      const user = await this.prisma.user.upsert({
        where: { keycloakSub: payload.sub },
        create: {
          keycloakSub: payload.sub,
          keycloakIssuer: settings.issuer,
          email: payload.email.toLowerCase(),
          passwordHash: null,
          fullName: name || username || payload.email,
          role,
        },
        update: { role, ...(name ? { fullName: name } : {}) },
      });
      return { sub: user.id, email: user.email, fullName: user.fullName, role };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException(
          'This identity conflicts with an existing CHRMS account. Contact your administrator.',
        );
      }
      throw error;
    }
  }
}
