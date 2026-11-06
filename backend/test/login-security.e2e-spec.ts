import { randomUUID } from 'crypto';
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

// Q-19. Runs against the database in .env; everything it creates is deleted in
// afterAll.

const suffix = randomUUID().slice(0, 6).toUpperCase();
const password = 'E2e-Password-123!';
const newPassword = 'E2e-Changed-456!';

describe('Login security (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const userIds: string[] = [];
  let officeId: string;
  let positionId: string;

  const server = () => app.getHttpServer();

  const cookieOf = (response: request.Response) =>
    (response.headers['set-cookie'] as unknown as string[])
      .map((cookie) => cookie.split(';')[0])
      .join('; ');

  const login = (account_number: string, secret: string) =>
    request(server())
      .post('/api/auth/login')
      .send({ account_number, password: secret });

  async function account(tag: string, mustChangePassword: boolean) {
    const accountNumber = `E7${tag}${suffix}`.slice(0, 10);
    const user = await prisma.user.create({
      data: {
        email: `e2e-login-${tag.toLowerCase()}-${suffix.toLowerCase()}@example.test`,
        account_number: accountNumber,
        rank: 'FO1',
        first_name: 'E2E',
        last_name: tag,
        password: await bcrypt.hash(password, 10),
        role: 'NHQ_VIEWER',
        officeId,
        positionId,
        mustChangePassword,
      },
    });
    userIds.push(user.id);
    return { id: user.id, accountNumber };
  }

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

    positionId = (
      await prisma.position.create({
        data: { name: `E2E Login Position ${suffix}` },
      })
    ).id;
    officeId = (
      await prisma.office.create({
        data: {
          name: `E2E Login NHQ ${suffix}`,
          type: 'NATIONAL_HEADQUARTERS',
        },
      })
    ).id;
  });

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.position.deleteMany({ where: { id: positionId } });
    await prisma.office.deleteMany({ where: { id: officeId } });
    await app.close();
  });

  it('blocks everything until the default password is changed', async () => {
    const { id, accountNumber } = await account('FC', true);

    const loggedIn = await login(accountNumber, password).expect(201);
    expect(loggedIn.body.mustChangePassword).toBe(true);
    expect(loggedIn.body).not.toHaveProperty('failedLoginCount');
    expect(loggedIn.body).not.toHaveProperty('lockedUntil');
    const cookie = cookieOf(loggedIn);

    const blocked = await request(server())
      .get(`/api/users/${id}`)
      .set('Cookie', cookie)
      .expect(403);
    expect(blocked.body.error).toBe('PASSWORD_CHANGE_REQUIRED');

    await request(server())
      .patch('/api/users')
      .set('Cookie', cookie)
      .send({ currentPassword: password, newPassword: password })
      .expect(400);

    // A mistyped password must not look like a dead session to the frontend.
    await request(server())
      .patch('/api/users')
      .set('Cookie', cookie)
      .send({ currentPassword: 'wrong-password', newPassword })
      .expect(400);

    await request(server())
      .patch('/api/users')
      .set('Cookie', cookie)
      .send({ currentPassword: password, newPassword })
      .expect(200);

    const refreshed = await request(server())
      .post('/api/auth/refresh_token')
      .set('Cookie', cookie)
      .expect(201);

    const profile = await request(server())
      .get(`/api/users/${id}`)
      .set('Cookie', cookieOf(refreshed))
      .expect(200);
    expect(profile.body.mustChangePassword).toBe(false);
    expect(profile.body).not.toHaveProperty('password');
    expect(profile.body).not.toHaveProperty('lockedUntil');
  });

  it('locks after 5 failed logins, even for the correct password, then recovers', async () => {
    const { id, accountNumber } = await account('LK', false);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      await login(accountNumber, 'wrong-password').expect(401);
    }

    const locked = await login(accountNumber, password).expect(401);
    expect(locked.body.message).toContain('locked for 15 minutes');

    const lockedUser = await prisma.user.findUnique({ where: { id } });
    expect(lockedUser?.lockedUntil?.getTime()).toBeGreaterThan(Date.now());

    // Time passing is simulated by moving the lock into the past.
    await prisma.user.update({
      where: { id },
      data: { lockedUntil: new Date(Date.now() - 1000) },
    });

    await login(accountNumber, password).expect(201);

    const cleared = await prisma.user.findUnique({ where: { id } });
    expect(cleared?.lockedUntil).toBeNull();
    expect(cleared?.failedLoginCount).toBe(0);
  });

  it('gives an unknown account the same message as a wrong password', async () => {
    const { accountNumber } = await account('MS', false);

    const unknown = await login(`NOPE${suffix}`, password).expect(401);
    const wrong = await login(accountNumber, 'wrong-password').expect(401);

    expect(unknown.body.message).toBe(wrong.body.message);
  });
});
