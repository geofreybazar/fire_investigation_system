import { createHash, randomUUID } from 'crypto';
import { mkdtemp, readdir, readFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
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

// Runs against the database in .env, with files written to a temporary
// UPLOAD_DIR. Everything it creates is deleted in afterAll.

const suffix = randomUUID().slice(0, 6).toUpperCase();
const password = 'E2e-Password-123!';

// A valid 1x1 PNG.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

describe('Attachments (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let uploadDir: string;

  const officeIds: string[] = [];
  const userIds: string[] = [];
  let positionId: string;
  let categoryId: string;
  let stationA: string;
  let caseId: string;

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
    const accountNumber = `E5${tag}${suffix}`.slice(0, 10);
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
    cookies[tag] = (response.headers['set-cookie'] as unknown as string[])
      .map((cookie) => cookie.split(';')[0])
      .join('; ');
    return user.id;
  }

  const upload = (tag: string, file: Buffer, name: string) =>
    request(server())
      .post(`/api/attachments/case/${caseId}`)
      .set('Cookie', cookies[tag])
      .field('description', 'Scene photo')
      .attach('file', file, name);

  beforeAll(async () => {
    uploadDir = await mkdtemp(join(tmpdir(), 'fiis-e2e-uploads-'));
    process.env.UPLOAD_DIR = uploadDir;

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
        data: { name: `E2E Attach Position ${suffix}` },
      })
    ).id;
    categoryId = (
      await prisma.fireIncidentCategory.create({
        data: { name: `E2E Attach Category ${suffix}`, type: 'STRUCTURAL' },
      })
    ).id;

    const nhq = await office({
      name: `E2E Attach NHQ ${suffix}`,
      type: 'NATIONAL_HEADQUARTERS',
    });
    const stationIn = async (tag: string) => {
      const region = await office({
        name: `E2E Attach Region ${tag} ${suffix}`,
        type: 'REGIONAL_OFFICE',
        parentId: nhq,
      });
      const district = await office({
        name: `E2E Attach District ${tag} ${suffix}`,
        type: 'DISTRICT_FIRE_STATION',
        parentId: region,
        regionId: region,
      });
      return office({
        name: `E2E Attach Station ${tag} ${suffix}`,
        type: 'CITY_FIRE_STATION',
        parentId: district,
        regionId: region,
      });
    };
    stationA = await stationIn('A');
    const stationB = await stationIn('B');

    // SA: the station's chief investigator, who creates the case.
    const chiefId = await account(
      'SA',
      'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR',
      stationA,
    );
    await account('IN', 'CITY_MUNICIPALITY_INVESTIGATOR', stationA);
    await account('SB', 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', stationB);

    caseId = (
      await prisma.investigationCase.create({
        data: {
          caseNo: `INV-E2E-${suffix}`,
          categoryId,
          stationId: stationA,
          createdByOfficeId: stationA,
          handlingOfficeId: stationA,
          createdById: chiefId,
          location: {
            create: {
              placeOfOccurence: '12 Rizal St.',
              barangay: 'San Isidro',
              region: 'Region',
              province_district: 'District',
              city_municipality: 'City',
            },
          },
        },
      })
    ).id;
  });

  afterAll(async () => {
    // The location and attachments cascade with the case.
    await prisma.investigationCase.deleteMany({ where: { id: caseId } });
    await prisma.auditLog.deleteMany({ where: { actorId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.fireIncidentCategory.deleteMany({ where: { id: categoryId } });
    await prisma.position.deleteMany({ where: { id: positionId } });
    for (const id of officeIds) {
      await prisma.office.deleteMany({ where: { id } });
    }
    await app.close();
    await rm(uploadDir, { recursive: true, force: true });
    delete process.env.UPLOAD_DIR;
  });

  let attachmentId: string;

  it("stores an upload from the case's chief, keeping the key private", async () => {
    const response = await upload('SA', PNG, 'scene.jpg').expect(201);
    attachmentId = response.body.id;

    // The content decides the type and extension, not the client's name.
    expect(response.body).toMatchObject({
      originalName: 'scene.png',
      mimeType: 'image/png',
      sizeBytes: PNG.length,
      sha256: createHash('sha256').update(PNG).digest('hex'),
      description: 'Scene photo',
    });
    expect(response.body).not.toHaveProperty('storageKey');

    const [stored] = await readdir(uploadDir);
    await expect(readFile(join(uploadDir, stored))).resolves.toEqual(PNG);
  });

  it('rejects a file whose content is not an allowed type', async () => {
    await upload(
      'SA',
      Buffer.from('<html><script></script></html>'),
      'photo.png',
    ).expect(415);
  });

  it('rejects files over 20 MB', async () => {
    const big = Buffer.concat([PNG, Buffer.alloc(20 * 1024 * 1024)]);
    await upload('SA', big, 'big.png').expect(413);
  });

  it('serves the file to viewers as a download and audits it', async () => {
    const listed = await request(server())
      .get(`/api/attachments/case/${caseId}`)
      .set('Cookie', cookies.IN)
      .expect(200);
    expect(listed.body).toHaveLength(1);

    const response = await request(server())
      .get(`/api/attachments/${attachmentId}/download`)
      .set('Cookie', cookies.IN)
      .buffer(true)
      .parse((res, done) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => done(null, Buffer.concat(chunks)));
      })
      .expect(200);

    expect(response.body).toEqual(PNG);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.headers['content-disposition']).toMatch(
      /^attachment; filename="scene\.png"/,
    );
    expect(response.headers['x-content-type-options']).toBe('nosniff');

    const audits = await prisma.auditLog.findMany({
      where: { entityId: attachmentId, action: 'ATTACHMENT_DOWNLOADED' },
    });
    expect(audits).toHaveLength(1);
  });

  it("hides another region's attachments", async () => {
    await request(server())
      .get(`/api/attachments/${attachmentId}/download`)
      .set('Cookie', cookies.SB)
      .expect(404);
    await upload('SB', PNG, 'scene.png').expect(404);
  });

  it('lets only the uploader remove a file, then hides it', async () => {
    await request(server())
      .delete(`/api/attachments/${attachmentId}`)
      .set('Cookie', cookies.IN)
      .expect(403);

    await request(server())
      .delete(`/api/attachments/${attachmentId}`)
      .set('Cookie', cookies.SA)
      .expect(200);

    await request(server())
      .get(`/api/attachments/${attachmentId}/download`)
      .set('Cookie', cookies.SA)
      .expect(404);
  });
});
