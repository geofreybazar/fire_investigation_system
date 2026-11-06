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
import { ROLE } from './../src/generated/prisma/enums.js';

// Runs against the database in .env. Every record it creates carries a unique
// suffix and is deleted in afterAll, so existing data is never touched.

const suffix = randomUUID().slice(0, 6).toUpperCase();
const password = 'E2e-Password-123!';

interface Admin {
  id: string;
  accountNumber: string;
  cookie: string;
}

describe('Audit log (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const officeIds: string[] = [];
  const userIds: string[] = [];
  const positionIds: string[] = [];

  let regionA: string;
  let stationA: string;
  let positionId: string;
  let adminA: Admin;
  let adminB: Admin;
  let nhqAdmin: Admin;

  const server = () => app.getHttpServer();

  async function createOffice(data: {
    name: string;
    type: 'NATIONAL_HEADQUARTERS' | 'REGIONAL_OFFICE' | 'CITY_FIRE_STATION';
    parentId?: string;
    regionId?: string;
    regionCode?: string;
  }) {
    const office = await prisma.office.create({ data });
    officeIds.unshift(office.id); // children are deleted before parents
    return office.id;
  }

  async function createAdmin(
    tag: string,
    role: ROLE,
    officeId: string,
  ): Promise<Admin> {
    const accountNumber = `E2${tag}${suffix}`.slice(0, 10);
    const user = await prisma.user.create({
      data: {
        email: `e2e-${tag.toLowerCase()}-${suffix.toLowerCase()}@example.test`,
        account_number: accountNumber,
        rank: 'FO1',
        first_name: 'E2E',
        last_name: tag,
        password: await bcrypt.hash(password, 10),
        role,
        officeId,
        positionId,
      },
    });
    userIds.push(user.id);

    const response = await request(server())
      .post('/api/auth/login')
      .send({ account_number: accountNumber, password })
      .expect(201);
    const cookies = response.headers['set-cookie'] as unknown as string[];

    return {
      id: user.id,
      accountNumber,
      cookie: cookies.map((cookie) => cookie.split(';')[0]).join('; '),
    };
  }

  const auditFor = async (admin: Admin, query: Record<string, string>) => {
    const response = await request(server())
      .get('/api/audit')
      .query(query)
      .set('Cookie', admin.cookie)
      .expect(200);
    return response.body.data as {
      action: string;
      entityId: string;
      changes: Record<string, unknown> | null;
      actor: { id: string };
    }[];
  };

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
      data: { name: `E2E Audit Position ${suffix}` },
    });
    positionId = position.id;
    positionIds.push(position.id);

    const nhq = await createOffice({
      name: `E2E NHQ ${suffix}`,
      type: 'NATIONAL_HEADQUARTERS',
    });
    regionA = await createOffice({
      name: `E2E Region A ${suffix}`,
      type: 'REGIONAL_OFFICE',
      parentId: nhq,
      regionCode: `EA${suffix}`,
    });
    const regionB = await createOffice({
      name: `E2E Region B ${suffix}`,
      type: 'REGIONAL_OFFICE',
      parentId: nhq,
      regionCode: `EB${suffix}`,
    });
    stationA = await createOffice({
      name: `E2E Station A ${suffix}`,
      type: 'CITY_FIRE_STATION',
      parentId: regionA,
      regionId: regionA,
    });

    adminA = await createAdmin('RA', 'REGIONAL_ADMIN', regionA);
    adminB = await createAdmin('RB', 'REGIONAL_ADMIN', regionB);
    nhqAdmin = await createAdmin('NA', 'NHQ_ADMIN', nhq);
  });

  afterAll(async () => {
    // Audit entries reference their actor, so they go first.
    await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.position.deleteMany({ where: { id: { in: positionIds } } });
    for (const id of officeIds) {
      await prisma.office.deleteMany({ where: { id } });
    }
    await app.close();
  });

  it('records a user creation and shows it only within scope', async () => {
    const accountNumber = `E2NU${suffix}`.slice(0, 10);

    const created = await request(server())
      .post('/api/users')
      .set('Cookie', adminA.cookie)
      .send({
        account_number: accountNumber,
        rank: 'FO1',
        first_name: 'New',
        last_name: 'Staff',
        email: `e2e-new-${suffix.toLowerCase()}@example.test`,
        role: 'CITY_MUNICIPALITY_INVESTIGATOR',
        officeId: stationA,
        positionId,
      })
      .expect(201);
    userIds.push(created.body.id);

    const query = { entityType: 'USER', entityId: created.body.id };

    // The creating regional admin and NHQ_ADMIN see it.
    const seenByA = await auditFor(adminA, query);
    expect(seenByA).toHaveLength(1);
    expect(seenByA[0]).toMatchObject({
      action: 'USER_CREATED',
      actor: { id: adminA.id },
    });
    expect(seenByA[0].changes).toMatchObject({
      account_number: accountNumber,
      officeId: stationA,
    });
    expect(JSON.stringify(seenByA[0].changes)).not.toMatch(/password/i);

    await expect(auditFor(nhqAdmin, query)).resolves.toHaveLength(1);

    // Another region's admin does not.
    await expect(auditFor(adminB, query)).resolves.toHaveLength(0);
  });

  it('records a position change for its actor, not for other regions', async () => {
    const created = await request(server())
      .post('/api/position_api')
      .set('Cookie', adminA.cookie)
      .send({ name: `E2E Audited Position ${suffix}` })
      .expect(201);
    positionIds.push(created.body.id);

    const query = { entityType: 'POSITION', entityId: created.body.id };

    await expect(auditFor(adminA, query)).resolves.toMatchObject([
      { action: 'POSITION_CREATED' },
    ]);
    await expect(auditFor(adminB, query)).resolves.toHaveLength(0);
  });

  it('forbids roles other than the three admins', async () => {
    const staff = await createAdmin(
      'ST',
      'CITY_MUNICIPALITY_INVESTIGATOR',
      stationA,
    );

    await request(server())
      .get('/api/audit')
      .set('Cookie', staff.cookie)
      .expect(403);
  });
});
