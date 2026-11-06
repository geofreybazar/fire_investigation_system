import { createHash, randomUUID } from 'crypto';
import { HttpAdapterHost } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, StandardSchemaValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types.js';

import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma.service.js';
import { PrismaExceptionFilter } from './../src/common/filters/prisma-exception.filter.js';

// Runs against the database in .env. Every record it creates carries a unique
// suffix and is deleted in afterAll, so existing data is never touched.

const suffix = randomUUID().slice(0, 8).toUpperCase();
const accountNumber = `E2E${suffix}`.slice(0, 10);
const password = 'E2e-Password-123!';

type Cookies = Record<string, { value: string; attributes: string }>;

// Parses Set-Cookie headers into name → value and raw attributes.
function cookiesOf(response: request.Response): Cookies {
  const header = response.headers['set-cookie'] as unknown as
    string[] | undefined;

  return Object.fromEntries(
    (header ?? []).map((cookie) => {
      const [pair, ...attributes] = cookie.split(';');
      const [name, ...value] = pair.split('=');
      return [
        name.trim(),
        { value: value.join('='), attributes: attributes.join(';') },
      ];
    }),
  );
}

const cookieHeader = (cookies: Record<string, string>) =>
  Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

describe('Auth flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let userId: string;
  let officeId: string;
  let positionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    // Same bootstrap as main.ts.
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(new StandardSchemaValidationPipe());
    app.useGlobalFilters(
      new PrismaExceptionFilter(app.get(HttpAdapterHost).httpAdapter),
    );
    await app.init();

    prisma = app.get(PrismaService);

    const position = await prisma.position.create({
      data: { name: `E2E Position ${suffix}` },
    });
    positionId = position.id;

    const office = await prisma.office.create({
      data: { name: `E2E Station ${suffix}`, type: 'CITY_FIRE_STATION' },
    });
    officeId = office.id;

    const user = await prisma.user.create({
      data: {
        email: `e2e-${suffix.toLowerCase()}@example.test`,
        account_number: accountNumber,
        rank: 'FO1',
        first_name: 'E2E',
        last_name: 'Tester',
        password: await bcrypt.hash(password, 10),
        role: 'CITY_MUNICIPALITY_INVESTIGATOR',
        officeId,
        positionId,
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    // Refresh tokens cascade with the user.
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.office.deleteMany({ where: { id: officeId } });
    await prisma.position.deleteMany({ where: { id: positionId } });
    await app.close();
  });

  const login = () =>
    request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ account_number: accountNumber, password });

  it('rejects a wrong password with a generic 401', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ account_number: accountNumber, password: 'wrong-password' })
      .expect(401);

    expect(response.body.message).toContain(
      'Invalid account number or password',
    );
    expect(cookiesOf(response).access_token).toBeUndefined();
  });

  it('logs in, refreshes, and logs out with the cookies cleared', async () => {
    // Login sets both httpOnly cookies and never returns the password hash.
    const loginResponse = await login().expect(201);
    const loginCookies = cookiesOf(loginResponse);

    expect(loginResponse.body.id).toBe(userId);
    expect(loginResponse.body.password).toBeUndefined();
    expect(loginCookies.access_token.attributes).toMatch(/HttpOnly/i);
    expect(loginCookies.refresh_token.attributes).toMatch(/HttpOnly/i);

    const accessToken = loginCookies.access_token.value;
    const refreshToken = loginCookies.refresh_token.value;

    // The refresh token is stored only as a hash.
    const stored = await prisma.refreshToken.findMany({ where: { userId } });
    expect(stored.map((row) => row.refreshToken)).toContain(
      sha256(refreshToken),
    );
    expect(stored.map((row) => row.refreshToken)).not.toContain(refreshToken);

    // A guarded route works with the access cookie and fails without it.
    await request(app.getHttpServer())
      .get(`/api/users/${userId}`)
      .set('Cookie', cookieHeader({ access_token: accessToken }))
      .expect(200);

    const noCookie = await request(app.getHttpServer())
      .get(`/api/users/${userId}`)
      .expect(401);
    expect(noCookie.body.error).toBe('TOKEN_EXPIRED');

    // Refresh rotates both cookies.
    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh_token')
      .set('Cookie', cookieHeader({ refresh_token: refreshToken }))
      .expect(201);
    const rotated = cookiesOf(refreshResponse);

    expect(rotated.refresh_token.value).toBeTruthy();
    expect(rotated.refresh_token.value).not.toBe(refreshToken);

    // The rotated-out refresh token can't be reused.
    await request(app.getHttpServer())
      .post('/api/auth/refresh_token')
      .set('Cookie', cookieHeader({ refresh_token: refreshToken }))
      .expect(401);

    // Logout deletes the stored token and clears both cookies.
    const logoutResponse = await request(app.getHttpServer())
      .post('/api/auth/logout')
      .set(
        'Cookie',
        cookieHeader({ refresh_token: rotated.refresh_token.value }),
      )
      .expect(201);
    const cleared = cookiesOf(logoutResponse);

    expect(cleared.access_token.value).toBe('');
    expect(cleared.access_token.attributes).toMatch(/Expires=Thu, 01 Jan 1970/);
    expect(cleared.refresh_token.value).toBe('');

    await request(app.getHttpServer())
      .post('/api/auth/refresh_token')
      .set(
        'Cookie',
        cookieHeader({ refresh_token: rotated.refresh_token.value }),
      )
      .expect(401);
  });

  it('refuses login and refresh for a deactivated user', async () => {
    const loginResponse = await login().expect(201);
    const refreshToken = cookiesOf(loginResponse).refresh_token.value;

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    try {
      await login().expect(401);

      await request(app.getHttpServer())
        .post('/api/auth/refresh_token')
        .set('Cookie', cookieHeader({ refresh_token: refreshToken }))
        .expect(401);
    } finally {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });
    }
  });
});
