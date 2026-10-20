import {
  Controller,
  Get,
  Req,
  UseGuards,
  INestApplication,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard, PassportModule } from '@nestjs/passport';
import { generateKeyPairSync } from 'node:crypto';
import { createServer, Server } from 'node:http';
import request = require('supertest');
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { Permission } from '../common/constants/permissions';
import { JwtStrategy } from './strategies/jwt.strategy';
import { KeycloakUserService } from './keycloak-user.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Controller('probe')
@UseGuards(AuthGuard('jwt'))
class ProbeController {
  @Get()
  me(@Req() req: { user: unknown }) {
    return req.user;
  }

  @Get('admin')
  @UseGuards(PermissionsGuard)
  @RequirePermissions(Permission.USERS_WRITE)
  admin() {
    return { ok: true };
  }
}

describe('Chiro Auth token verification and CHRMS authorization', () => {
  let app: INestApplication;
  let jwks: Server;
  let issuer: string;
  let config: ConfigService;
  const jwt = new JwtService();
  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
  const signingKey = privateKey
    .export({ type: 'pkcs8', format: 'pem' })
    .toString();
  const prisma = { user: { findUnique: jest.fn(), upsert: jest.fn() } };
  const base = () => ({
    sub: 'keycloak-user-id',
    typ: 'Bearer',
    azp: 'chrms-web',
    email: 'officer@example.com',
    email_verified: true,
    name: 'Land Officer',
    resource_access: { 'chrms-api': { roles: ['HOUSING_OFFICER'] } },
  });
  const token = (claims = {}, options = {}) =>
    jwt.sign(
      { ...base(), ...claims },
      {
        privateKey: signingKey,
        algorithm: 'RS256',
        keyid: 'test-key',
        issuer,
        audience: 'chrms-api',
        expiresIn: 300,
        ...options,
      },
    );
  const get = (bearer: string, path = '/probe') =>
    request(app.getHttpServer()).get(path).auth(bearer, { type: 'bearer' });

  beforeAll(async () => {
    jwks = createServer((_req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          keys: [
            {
              ...publicKey.export({ format: 'jwk' }),
              kid: 'test-key',
              use: 'sig',
              alg: 'RS256',
            },
          ],
        }),
      );
    });
    await new Promise<void>((resolve) => jwks.listen(0, '127.0.0.1', resolve));
    const address = jwks.address() as { port: number };
    const url = `http://127.0.0.1:${address.port}`;
    issuer = `${url}/realms/chirocity`;
    config = new ConfigService({ AUTH_MODE: 'keycloak', KEYCLOAK_URL: url });
    const module = await Test.createTestingModule({
      imports: [PassportModule],
      controllers: [ProbeController, AuthController],
      providers: [
        AuthService,
        { provide: JwtService, useValue: jwt },
        JwtStrategy,
        KeycloakUserService,
        PermissionsGuard,
        { provide: ConfigService, useValue: config },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.upsert.mockImplementation(({ create, update }) =>
      Promise.resolve({
        id: 'local-user-id',
        isActive: true,
        ...create,
        ...update,
      }),
    );
  });
  afterAll(async () => {
    await app?.close();
    await new Promise<void>((resolve) => jwks.close(() => resolve()));
  });

  it('provisions an authorized, verified identity and returns the local user ID', async () => {
    const response = await get(token()).expect(200);
    expect(response.body).toEqual({
      sub: 'local-user-id',
      fullName: 'Land Officer',
      email: 'officer@example.com',
      role: 'HOUSING_OFFICER',
    });
    expect(
      prisma.user.upsert.mock.calls[0][0].create.passwordHash,
    ).toBeNull();
  });
  it.each([
    [
      'wrong issuer',
      {},
      { issuer: 'https://another.example/realms/chirocity' },
    ],
    ['wrong audience', {}, { audience: 'hrms-api' }],
    ['expired token', {}, { expiresIn: -10 }],
    ['ID token', { typ: 'ID' }, {}],
    ['another client', { azp: 'hrms-web' }, {}],
  ])('rejects %s before provisioning', async (_label, claims, options) => {
    await get(token(claims, options)).expect(401);
    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
  it('rejects a legacy local token and unsigned tokens', async () => {
    await get(
      jwt.sign(base(), { secret: 'old-local-secret', algorithm: 'HS256' }),
    ).expect(401);
    const unsigned = `${Buffer.from(JSON.stringify({ alg: 'none' })).toString('base64url')}.${Buffer.from(JSON.stringify(base())).toString('base64url')}.`;
    await get(unsigned).expect(401);
  });
  it('rejects a token signed by a different RSA key', async () => {
    const other = generateKeyPairSync('rsa', { modulusLength: 2048 })
      .privateKey.export({ type: 'pkcs8', format: 'pem' })
      .toString();
    await get(token({}, { privateKey: other })).expect(401);
  });
  it('requires expiration on otherwise valid tokens', async () => {
    const noExpiry = jwt.sign(base(), {
      privateKey: signingKey,
      algorithm: 'RS256',
      keyid: 'test-key',
      issuer,
      audience: 'chrms-api',
    });
    await get(noExpiry).expect(401);
  });
  it('does not treat master or realm administrator roles as CHRMS access', async () => {
    await get(
      token({
        resource_access: { 'realm-management': { roles: ['realm-admin'] } },
        realm_access: { roles: ['ADMIN'] },
      }),
    ).expect(403);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
  it('requires a verified email', async () => {
    await get(token({ email_verified: false })).expect(403);
    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
  it('never automatically links an existing email', async () => {
    prisma.user.findUnique.mockImplementation(({ where }) =>
      Promise.resolve(where.email ? { id: 'old-admin' } : null),
    );
    await get(token()).expect(403);
    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
  it('preserves linked local IDs but enforces the current token role', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'historical-id',
      isActive: true,
      keycloakIssuer: issuer,
      role: 'ADMIN',
    });
    prisma.user.upsert.mockResolvedValue({
      id: 'historical-id',
      isActive: true,
      email: 'officer@example.com',
      role: 'ADMIN',
    });
    const response = await get(token()).expect(200);
    expect(response.body.sub).toBe('historical-id');
    expect(response.body.role).toBe('HOUSING_OFFICER');
    await get(token(), '/probe/admin').expect(403);
  });
  it('allows CHRMS administrators and denies removed CHRMS roles', async () => {
    await get(
      token({ resource_access: { 'chrms-api': { roles: ['ADMIN'] } } }),
      '/probe/admin',
    ).expect(200);
    await get(token({ resource_access: {} })).expect(403);
  });
  it('rejects identities linked under another issuer', async () => {
    prisma.user.findUnique.mockResolvedValue({
      keycloakIssuer: 'https://old.example/realms/chirocity',
      isActive: true,
    });
    await get(token()).expect(403);
    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
  it('disables local password login entirely in Keycloak mode', async () => {
    const service = new AuthService(
      prisma as unknown as PrismaService,
      config,
      jwt,
    );
    await expect(
      service.login('admin@example.com', 'password'),
    ).rejects.toThrow('Use Chiro Auth');
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
  it('returns the browser profile shape and disables the actual local login endpoint', async () => {
    const me = await get(token(), '/auth/me').expect(200);
    expect(me.body).toMatchObject({ id: 'local-user-id', fullName: 'Land Officer', role: 'HOUSING_OFFICER' });
    const configResponse = await request(app.getHttpServer()).get('/auth/config').expect(200);
    expect(configResponse.body.mode).toBe('keycloak');
    await request(app.getHttpServer()).post('/auth/login').send({ email: 'admin@example.com', password: 'password' }).expect(403);
  });
});
