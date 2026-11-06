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

// Investigation cases end to end (REQUIREMENTS.md §4–5) and Q-51. Runs against
// the database in .env; everything it creates is deleted in afterAll.

const suffix = randomUUID().slice(0, 6).toUpperCase();
const regionCode = `E${suffix.slice(0, 5)}`;
const password = 'E2e-Password-123!';

describe('Investigation case rules (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const officeIds: string[] = [];
  const userIds: string[] = [];
  const caseIds: string[] = [];
  let positionId: string;
  let categoryId: string;
  let nhq: string;
  let region: string;
  let otherRegion: string;
  let districtA: string;
  let districtB: string;
  let station: string;
  const ids: Record<string, string> = {};

  const cookies: Record<string, string> = {};
  const server = () => app.getHttpServer();

  async function office(
    data: Parameters<typeof prisma.office.create>[0]['data'],
  ) {
    const created = await prisma.office.create({ data });
    officeIds.unshift(created.id); // children are deleted before parents
    return created.id;
  }

  async function account(tag: string, role: ROLE, officeId: string) {
    const accountNumber = `E6${tag}${suffix}`.slice(0, 10);
    const user = await prisma.user.create({
      data: {
        email: `e2e-case-${tag.toLowerCase()}-${suffix.toLowerCase()}@example.test`,
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
    ids[tag] = user.id;

    const response = await request(server())
      .post('/api/auth/login')
      .send({ account_number: accountNumber, password })
      .expect(201);
    cookies[tag] = (response.headers['set-cookie'] as unknown as string[])
      .map((cookie) => cookie.split(';')[0])
      .join('; ');
  }

  const as = (tag: string) => ({
    get: (url: string) =>
      request(server()).get(url).set('Cookie', cookies[tag]),
    post: (url: string) =>
      request(server()).post(url).set('Cookie', cookies[tag]),
    patch: (url: string) =>
      request(server()).patch(url).set('Cookie', cookies[tag]),
    delete: (url: string) =>
      request(server()).delete(url).set('Cookie', cookies[tag]),
  });

  async function createCase(tag: string, investigatorTag: string) {
    const response = await as(tag)
      .post('/api/case')
      .send({
        stationId: station,
        categoryId,
        dateTimeFireIncident: '2026-11-01T10:00:00.000Z',
        location: { placeOfOccurence: '12 Rizal St.', barangay: 'San Isidro' },
        impact: { fatalitiesCiv: 1, estimatedDamages: 150000 },
        investigatorId: ids[investigatorTag],
      })
      .expect(201);
    caseIds.push(response.body.id);
    return response.body as {
      id: string;
      caseNo: string;
      investigation: { id: string; investigationNo: string };
    };
  }

  const concludeAndSubmit = async (tag: string, investigationId: string) => {
    await as(tag)
      .patch(`/api/investigation/${investigationId}`)
      .send({
        classification: 'ACCIDENTAL',
        causeOfFire: 'OVERHEATED_HOME_APPLIANCES',
        report: { findings: 'Overheated rice cooker.' },
      })
      .expect(200);
    await as(tag)
      .post(`/api/investigation/${investigationId}/submit`)
      .expect(201);
  };

  const moveStation = (parentId: string) =>
    as('AD')
      .patch(`/api/office_api/${station}`)
      .send({
        name: `E2E Case Station ${suffix}`,
        type: 'CITY_FIRE_STATION',
        parentId,
      });

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
        data: { name: `E2E Case Position ${suffix}` },
      })
    ).id;
    categoryId = (
      await prisma.fireIncidentCategory.create({
        data: { name: `E2E Case Category ${suffix}`, type: 'STRUCTURAL' },
      })
    ).id;

    nhq = await office({
      name: `E2E Case NHQ ${suffix}`,
      type: 'NATIONAL_HEADQUARTERS',
    });
    region = await office({
      name: `E2E Case Region ${suffix}`,
      type: 'REGIONAL_OFFICE',
      parentId: nhq,
      regionCode,
    });
    otherRegion = await office({
      name: `E2E Case Other Region ${suffix}`,
      type: 'REGIONAL_OFFICE',
      parentId: nhq,
    });
    const district = (tag: string) =>
      office({
        name: `E2E Case District ${tag} ${suffix}`,
        type: 'DISTRICT_FIRE_STATION',
        parentId: region,
        regionId: region,
      });
    districtA = await district('A');
    districtB = await district('B');
    station = await office({
      name: `E2E Case Station ${suffix}`,
      type: 'CITY_FIRE_STATION',
      parentId: districtA,
      regionId: region,
    });

    await account('AD', 'NHQ_ADMIN', nhq);
    // The SUPER_ADMIN account is created in the database, never via the API.
    await account('SA', 'SUPER_ADMIN', nhq);
    await account('SC', 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', station);
    await account('SI', 'CITY_MUNICIPALITY_INVESTIGATOR', station);
    await account('RC', 'REGIONAL_CHIEF_INVESTIGATOR', region);
    await account('RI', 'REGIONAL_INVESTIGATOR', region);
    await account('OC', 'REGIONAL_CHIEF_INVESTIGATOR', otherRegion);
    await account('DC', 'DISTRICT_PROVINCE_CHIEF_INVESTIGATOR', districtA);
    await account('DI', 'DISTRICT_PROVINCE_INVESTIGATOR', districtA);
  });

  afterAll(async () => {
    // Location, impact, investigations, reports and referrals cascade.
    await prisma.investigationCase.deleteMany({
      where: { id: { in: caseIds } },
    });
    await prisma.incidentNumberCounter.deleteMany({ where: { regionCode } });
    await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.fireIncidentCategory.deleteMany({ where: { id: categoryId } });
    await prisma.position.deleteMany({ where: { id: positionId } });
    for (const id of officeIds) {
      await prisma.office.deleteMany({ where: { id } });
    }
    await app.close();
  });

  it('runs a case from creation through a second investigation after referral', async () => {
    const created = await createCase('SC', 'SI');

    expect(created.caseNo).toMatch(
      new RegExp(`^INV-\\d{4}-\\d{2}-${regionCode}-\\d{6}$`),
    );
    expect(created.investigation.investigationNo).toBe(`${created.caseNo}-01`);

    const detail = await as('SC').get(`/api/case/${created.id}`).expect(200);
    expect(detail.body).toMatchObject({
      handlingOffice: { id: station },
      station: { id: station },
      location: {
        placeOfOccurence: '12 Rizal St.',
        city_municipality: `E2E Case Station ${suffix}`,
        province_district: `E2E Case District A ${suffix}`,
        region: `E2E Case Region ${suffix}`,
      },
      canDecide: false,
    });

    // While -01 is open: no referral and no second investigation.
    await as('SC')
      .post(`/api/case/${created.id}/refer`)
      .send({ toOfficeId: region })
      .expect(409);
    await as('SC')
      .post(`/api/case/${created.id}/start`)
      .send({ investigatorId: ids.SI })
      .expect(409);

    // The investigator reports; the chief rejects, then approves.
    const first = created.investigation.id;
    await concludeAndSubmit('SI', first);
    await as('SC')
      .post(`/api/investigation/${first}/review`)
      .send({ decision: 'REJECTED', remarks: 'Add witness statements.' })
      .expect(201);
    await concludeAndSubmit('SI', first);
    await as('SC')
      .post(`/api/investigation/${first}/review`)
      .send({ decision: 'APPROVED' })
      .expect(201);

    // Approved: the case fields are locked, and the chief may refer it up.
    await as('SC')
      .patch(`/api/case/${created.id}`)
      .send({ remarks: 'Late edit' })
      .expect(409);
    const referred = await as('SC')
      .post(`/api/case/${created.id}/refer`)
      .send({ toOfficeId: region, remarks: 'For re-investigation' })
      .expect(201);
    expect(referred.body.direction).toBe('UP');

    // The station's chief no longer decides; the regional chief does.
    await as('SC')
      .post(`/api/case/${created.id}/start`)
      .send({ investigatorId: ids.SI })
      .expect(403);
    const queue = await as('RC').get('/api/investigation/queue').expect(200);
    expect(queue.body.data).toContainEqual(
      expect.objectContaining({ id: created.id, awaiting: 'DECISION' }),
    );
    const second = await as('RC')
      .post(`/api/case/${created.id}/start`)
      .send({ investigatorId: ids.RI })
      .expect(201);
    expect(second.body.investigationNo).toBe(`${created.caseNo}-02`);
  });

  it('lets a higher office open a case for a station below it', async () => {
    const created = await createCase('DC', 'DI');

    const detail = await as('DC').get(`/api/case/${created.id}`).expect(200);
    expect(detail.body).toMatchObject({
      station: { id: station },
      createdByOffice: { id: districtA },
      handlingOffice: { id: districtA },
    });
  });

  it('keeps cases out of reach of other regions and of admins', async () => {
    const created = await createCase('SC', 'SI');

    await as('OC').get(`/api/case/${created.id}`).expect(404);
    await as('AD').get(`/api/case/${created.id}`).expect(403);
    await as('AD').get('/api/case').expect(403);

    // A chief of another region cannot open a case for this station.
    await as('OC')
      .post('/api/case')
      .send({
        stationId: station,
        categoryId,
        location: { placeOfOccurence: 'X', barangay: 'Y' },
        investigatorId: ids.SI,
      })
      .expect(400);

    const listed = await as('OC').get('/api/case').expect(200);
    expect(
      listed.body.data.map((found: { id: string }) => found.id),
    ).not.toContain(created.id);
  });

  it('lets only SUPER_ADMIN delete and restore a case, hiding it meanwhile', async () => {
    const created = await createCase('SC', 'SI');
    const deletion = { reason: 'Duplicate entry', memoReference: 'MEMO-E2E' };

    await as('SC').delete(`/api/case/${created.id}`).send(deletion).expect(403);
    await as('SA').delete(`/api/case/${created.id}`).send(deletion).expect(200);

    await as('SC').get(`/api/case/${created.id}`).expect(404);
    await as('SI')
      .get(`/api/investigation/${created.investigation.id}`)
      .expect(404);
    const deleted = await as('SA').get('/api/case/deleted').expect(200);
    expect(deleted.body.data).toContainEqual(
      expect.objectContaining({
        id: created.id,
        deletionMemoReference: 'MEMO-E2E',
      }),
    );

    await as('SA').post(`/api/case/${created.id}/restore`).expect(201);
    await as('SC').get(`/api/case/${created.id}`).expect(200);

    const audit = await prisma.auditLog.findMany({
      where: { entityType: 'INVESTIGATION_CASE', entityId: created.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(audit.map((entry) => entry.action)).toEqual([
      'CASE_DELETED',
      'CASE_RESTORED',
    ]);
  });

  describe('moving a station (Q-51)', () => {
    it('blocks the move while a case handled by the old district is unfinished, then returns it once finished', async () => {
      const created = await createCase('DC', 'DI');

      const refused = await moveStation(districtB).expect(409);
      expect(refused.body.message).toContain(created.caseNo);

      // Finish every investigation the old district handles (an earlier test
      // opened one too). Cases handled by the station or the region stay in
      // the station's new chain and don't matter.
      await prisma.investigation.updateMany({
        where: { case: { handlingOfficeId: districtA }, completedAt: null },
        data: { completedAt: new Date() },
      });

      await moveStation(districtB).expect(200);

      const moved = await prisma.investigationCase.findUnique({
        where: { id: created.id },
        include: { referrals: true },
      });
      expect(moved?.handlingOfficeId).toBe(station);
      expect(moved?.referrals).toEqual([
        expect.objectContaining({
          fromOfficeId: districtA,
          toOfficeId: station,
          direction: 'DOWN',
        }),
      ]);
    });
  });
});
