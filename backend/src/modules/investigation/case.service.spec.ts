import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { type UUID } from 'crypto';
import { CaseService } from './case.service.js';
import { CaseRepository } from './case.repository.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { type ROLE } from '../../generated/prisma/enums.js';
import { NotificationDispatcher } from '../notification/notification.dispatcher.js';
import { type CreateCaseInput } from './schema/case.schema.js';

const STATION = 'station-1';
const DISTRICT = 'district-1';
const REGION = 'region-1';
const NHQ = 'nhq';
const caseId = '11111111-1111-4111-8111-111111111111';
const investigationId = '22222222-2222-4222-8222-222222222222';
const investigatorId = '33333333-3333-4333-8333-333333333333';
const categoryId = '55555555-5555-4555-8555-555555555555';

const officeTypes: Record<string, string> = {
  [STATION]: 'CITY_FIRE_STATION',
  [DISTRICT]: 'DISTRICT_FIRE_STATION',
  [REGION]: 'REGIONAL_OFFICE',
  [NHQ]: 'NATIONAL_HEADQUARTERS',
  'other-region': 'REGIONAL_OFFICE',
};

const userWith = (
  role: ROLE,
  officeId: string,
  sub = '44444444-4444-4444-8444-444444444444',
): CurrentUserJwtPayload => ({
  sub: sub as UUID,
  account_number: 'ACC001',
  role,
  positionId: 'position-1',
  officeId,
});

const stationChief = userWith('CITY_MUNICIPALITY_CHIEF_INVESTIGATOR', STATION);
const districtChief = userWith(
  'DISTRICT_PROVINCE_CHIEF_INVESTIGATOR',
  DISTRICT,
);
const regionalChief = userWith('REGIONAL_CHIEF_INVESTIGATOR', REGION);
const otherRegionalChief = userWith(
  'REGIONAL_CHIEF_INVESTIGATOR',
  'other-region',
);
const investigator = userWith(
  'CITY_MUNICIPALITY_INVESTIGATOR',
  STATION,
  investigatorId,
);
const viewer = userWith('REGIONAL_VIEWER', REGION);
const superAdmin = userWith('SUPER_ADMIN', NHQ);

const station = (overrides: Record<string, unknown> = {}) => ({
  id: STATION,
  name: 'Quezon City Fire Station',
  type: 'CITY_FIRE_STATION',
  isActive: true,
  parentId: DISTRICT,
  regionId: REGION,
  parent: { id: DISTRICT, name: 'QC District', type: 'DISTRICT_FIRE_STATION' },
  region: {
    id: REGION,
    name: 'NCR',
    type: 'REGIONAL_OFFICE',
    regionCode: 'NCR',
    parent: { id: NHQ, name: 'NHQ', type: 'NATIONAL_HEADQUARTERS' },
  },
  ...overrides,
});

const accessCase = (overrides: Record<string, unknown> = {}) => ({
  id: caseId,
  caseNo: 'INV-2026-11-NCR-000001',
  deletedAt: null,
  createdById: stationChief.sub,
  categoryId,
  handlingOfficeId: STATION,
  station: station(),
  ...overrides,
});

const newCase = (
  overrides: Partial<CreateCaseInput> = {},
): CreateCaseInput => ({
  stationId: STATION,
  categoryId,
  location: { placeOfOccurence: '12 Rizal St', barangay: 'Poblacion' },
  investigatorId,
  ...overrides,
});

describe('CaseService', () => {
  let service: CaseService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;
  let dispatcher: { notify: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    dispatcher = { notify: vi.fn().mockResolvedValue(undefined) };
    repository = {
      findOfficeType: vi.fn((officeId: string) =>
        Promise.resolve({ id: officeId, type: officeTypes[officeId] }),
      ),
      findStation: vi.fn().mockResolvedValue(station()),
      findCategory: vi.fn().mockResolvedValue({ id: categoryId }),
      findSubcategory: vi
        .fn()
        .mockResolvedValue({ id: 'sub-1', categoryId: 'another-category' }),
      findEstablishment: vi.fn().mockResolvedValue({ id: 'est-1' }),
      findUser: vi.fn().mockResolvedValue({
        id: investigatorId,
        role: 'CITY_MUNICIPALITY_INVESTIGATOR',
        isActive: true,
        officeId: STATION,
      }),
      findInvestigators: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockResolvedValue({
        id: caseId,
        caseNo: 'INV-2026-11-NCR-000001',
        investigations: [
          { id: investigationId, investigationNo: 'INV-2026-11-NCR-000001-01' },
        ],
      }),
      findPaginated: vi.fn().mockResolvedValue({ cases: [], total: 0 }),
      findDeletedPaginated: vi.fn().mockResolvedValue({ cases: [], total: 0 }),
      findForAccess: vi.fn().mockResolvedValue(accessCase()),
      findDetail: vi.fn().mockResolvedValue({
        id: caseId,
        referrals: [],
        investigations: [],
      }),
      update: vi.fn().mockResolvedValue(true),
      refer: vi.fn().mockResolvedValue(true),
      start: vi.fn().mockResolvedValue({
        id: investigationId,
        investigationNo: 'INV-2026-11-NCR-000001-02',
      }),
      softDelete: vi.fn().mockResolvedValue(true),
      restore: vi.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CaseService,
        { provide: CaseRepository, useValue: repository },
        { provide: NotificationDispatcher, useValue: dispatcher },
      ],
    }).compile();

    service = module.get<CaseService>(CaseService);
  });

  describe('create', () => {
    it('creates the case at the station with the location derived from it, handled by the creator', async () => {
      await expect(service.create(newCase(), stationChief)).resolves.toEqual({
        id: caseId,
        caseNo: 'INV-2026-11-NCR-000001',
        investigation: {
          id: investigationId,
          investigationNo: 'INV-2026-11-NCR-000001-01',
        },
      });

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          station: { id: STATION, regionCode: 'NCR' },
          createdByOfficeId: STATION,
          createdById: stationChief.sub,
          assignedInvestigatorId: investigatorId,
          location: {
            placeOfOccurence: '12 Rizal St',
            barangay: 'Poblacion',
            latitude: null,
            longitude: null,
            city_municipality: 'Quezon City Fire Station',
            province_district: 'QC District',
            region: 'NCR',
          },
        }),
      );
      expect(dispatcher.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'INVESTIGATOR_ASSIGNED',
          entityId: investigationId,
          recipients: { userIds: [investigatorId] },
        }),
      );
    });

    it("lets a regional chief open a case for a station in its region, assigning the region's investigator", async () => {
      repository.findUser.mockResolvedValue({
        id: investigatorId,
        role: 'REGIONAL_INVESTIGATOR',
        isActive: true,
        officeId: REGION,
      });

      await service.create(newCase(), regionalChief);

      expect(repository.create).toHaveBeenCalledWith(
        expect.objectContaining({ createdByOfficeId: REGION }),
      );
    });

    it('rejects a station outside the creator’s scope', async () => {
      await expect(
        service.create(newCase(), otherRegionalChief),
      ).rejects.toThrow(BadRequestException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it.each([
      ['not a city/municipal station', { type: 'DISTRICT_FIRE_STATION' }],
      ['inactive', { isActive: false }],
      [
        'missing its region code',
        { region: { ...station().region, regionCode: null } },
      ],
    ])('rejects a station that is %s', async (_label, overrides) => {
      repository.findStation.mockResolvedValue(station(overrides));

      await expect(service.create(newCase(), stationChief)).rejects.toThrow(
        BadRequestException,
      );
    });

    it("rejects an investigator who is not from the creator's office", async () => {
      repository.findUser.mockResolvedValue({
        id: investigatorId,
        role: 'CITY_MUNICIPALITY_INVESTIGATOR',
        isActive: true,
        officeId: 'another-station',
      });

      await expect(service.create(newCase(), stationChief)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('rejects a subcategory of another category', async () => {
      await expect(
        service.create(newCase({ subcategoryId: 'sub-1' }), stationChief),
      ).rejects.toThrow(BadRequestException);
    });

    it('forbids non-chiefs', async () => {
      await expect(service.create(newCase(), investigator)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findStations', () => {
    it("offers only stations below the chief's office", async () => {
      repository.findStations = vi.fn().mockResolvedValue([]);

      await service.findStations(regionalChief);

      expect(repository.findStations).toHaveBeenCalledWith({
        OR: [{ id: REGION }, { parentId: REGION }, { regionId: REGION }],
      });
    });

    it('forbids non-chiefs', async () => {
      await expect(service.findStations(viewer)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findOne', () => {
    it("lets the handling chief decide when no investigation is open, offering the station's chain", async () => {
      const result = await service.findOne(caseId, stationChief);

      expect(result.canDecide).toBe(true);
      expect(result.canEdit).toBe(true);
      expect(result.referralTargets.map((office) => office.id)).toEqual([
        DISTRICT,
        REGION,
        NHQ,
      ]);
    });

    it('lets nobody decide while an investigation is open', async () => {
      repository.findDetail.mockResolvedValue({
        id: caseId,
        referrals: [],
        investigations: [{ id: investigationId, completedAt: null }],
      });

      const result = await service.findOne(caseId, stationChief);

      expect(result.canDecide).toBe(false);
      expect(result.referralTargets).toEqual([]);
    });

    it('locks editing once an investigation is completed', async () => {
      repository.findDetail.mockResolvedValue({
        id: caseId,
        referrals: [],
        investigations: [{ id: investigationId, completedAt: new Date() }],
      });

      const result = await service.findOne(caseId, stationChief);

      expect(result.canEdit).toBe(false);
      expect(result.canDecide).toBe(true);
    });

    it('shows the case read-only to viewers in scope', async () => {
      const result = await service.findOne(caseId, viewer);

      expect(result.canDecide).toBe(false);
      expect(result.canEdit).toBe(false);
    });

    it.each([
      ['out of scope', otherRegionalChief, accessCase()],
      ['deleted', stationChief, accessCase({ deletedAt: new Date() })],
    ])('returns 404 for a case that is %s', async (_label, user, found) => {
      repository.findForAccess.mockResolvedValue(found);

      await expect(service.findOne(caseId, user)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('forbids admins who have no case access', async () => {
      await expect(
        service.findOne(caseId, userWith('REGIONAL_ADMIN', REGION)),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findAll', () => {
    it('limits the list to stations in the viewer’s scope and leaves out deleted cases', async () => {
      await service.findAll({ page: 1 }, regionalChief);

      const [where] = repository.findPaginated.mock.calls[0];
      expect(where.AND[0]).toEqual({
        deletedAt: null,
        station: {
          OR: [{ id: REGION }, { parentId: REGION }, { regionId: REGION }],
        },
      });
    });

    it('lets NHQ see every case', async () => {
      await service.findAll(
        { page: 1, state: 'OPEN' },
        userWith('NHQ_VIEWER', NHQ),
      );

      const [where] = repository.findPaginated.mock.calls[0];
      expect(where.AND).toEqual([
        { deletedAt: null },
        { investigations: { some: { completedAt: null } } },
      ]);
    });
  });

  describe('update', () => {
    it('lets the handling chief edit', async () => {
      await expect(
        service.update(caseId, { remarks: 'Updated' }, stationChief),
      ).resolves.toEqual({ message: 'Investigation case updated.' });
    });

    it('forbids a chief who neither created nor handles the case', async () => {
      repository.findForAccess.mockResolvedValue(
        accessCase({ createdById: 'someone-else' }),
      );

      await expect(
        service.update(caseId, { remarks: 'x' }, regionalChief),
      ).rejects.toThrow(ForbiddenException);
    });

    it('checks a new subcategory against the current category', async () => {
      await expect(
        service.update(caseId, { subcategoryId: 'sub-1' }, stationChief),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns 409 once the case is locked', async () => {
      repository.update.mockResolvedValue(false);

      await expect(
        service.update(caseId, { remarks: 'x' }, stationChief),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('refer', () => {
    it('refers the case up from the station, recording the direction and notifying the target chiefs', async () => {
      await expect(
        service.refer(caseId, { toOfficeId: REGION }, stationChief),
      ).resolves.toEqual({ message: 'Case referred.', direction: 'UP' });
      expect(repository.refer).toHaveBeenCalledWith(caseId, {
        fromOfficeId: STATION,
        toOfficeId: REGION,
        direction: 'UP',
        referredById: stationChief.sub,
        remarks: undefined,
      });
      expect(dispatcher.notify).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CASE_REFERRED',
          entityType: 'INVESTIGATION_CASE',
          entityId: caseId,
          recipients: {
            officeId: REGION,
            roles: expect.arrayContaining(['REGIONAL_CHIEF_INVESTIGATOR']),
          },
        }),
      );
    });

    it('lets the new handling office refer it back down', async () => {
      repository.findForAccess.mockResolvedValue(
        accessCase({ handlingOfficeId: REGION }),
      );

      await expect(
        service.refer(caseId, { toOfficeId: DISTRICT }, regionalChief),
      ).resolves.toMatchObject({ direction: 'DOWN' });
    });

    it("forbids the station's chief once the case has moved up", async () => {
      repository.findForAccess.mockResolvedValue(
        accessCase({ handlingOfficeId: REGION }),
      );

      await expect(
        service.refer(caseId, { toOfficeId: NHQ }, stationChief),
      ).rejects.toThrow(ForbiddenException);
    });

    it('forbids a chief of an office above that does not handle the case', async () => {
      await expect(
        service.refer(caseId, { toOfficeId: REGION }, districtChief),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects a target outside the chain', async () => {
      await expect(
        service.refer(caseId, { toOfficeId: 'other-region' }, stationChief),
      ).rejects.toThrow(BadRequestException);
    });

    it('returns 409 when an investigation is open', async () => {
      repository.refer.mockResolvedValue(false);

      await expect(
        service.refer(caseId, { toOfficeId: REGION }, stationChief),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('start', () => {
    it('starts a further investigation at the handling office', async () => {
      await expect(
        service.start(caseId, { investigatorId }, stationChief),
      ).resolves.toEqual({
        id: investigationId,
        investigationNo: 'INV-2026-11-NCR-000001-02',
      });
      expect(repository.start).toHaveBeenCalledWith(caseId, {
        conductingOfficeId: STATION,
        assignedInvestigatorId: investigatorId,
        assignedById: stationChief.sub,
      });
    });

    it.each([
      ['inactive', { isActive: false }],
      ['not an investigator', { role: 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR' }],
      ['from another office', { officeId: DISTRICT }],
    ])('rejects an assignee who is %s', async (_label, overrides) => {
      repository.findUser.mockResolvedValue({
        id: investigatorId,
        role: 'CITY_MUNICIPALITY_INVESTIGATOR',
        isActive: true,
        officeId: STATION,
        ...overrides,
      });

      await expect(
        service.start(caseId, { investigatorId }, stationChief),
      ).rejects.toThrow(BadRequestException);
      expect(repository.start).not.toHaveBeenCalled();
    });

    it('returns 409 when an investigation is already open', async () => {
      repository.start.mockResolvedValue(null);

      await expect(
        service.start(caseId, { investigatorId }, stationChief),
      ).rejects.toThrow(ConflictException);
    });

    it('forbids an investigator from starting', async () => {
      await expect(
        service.start(caseId, { investigatorId }, investigator),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deletion (SUPER_ADMIN)', () => {
    const deletion = { reason: 'Duplicate', memoReference: 'MEMO-1' };

    it('lets SUPER_ADMIN delete and restore', async () => {
      await service.remove(caseId, deletion, superAdmin);
      await service.restore(caseId, superAdmin);

      expect(repository.softDelete).toHaveBeenCalledWith(
        caseId,
        superAdmin.sub,
        deletion,
      );
      expect(repository.restore).toHaveBeenCalledWith(caseId, superAdmin.sub);
    });

    it('forbids everyone else', async () => {
      await expect(
        service.remove(caseId, deletion, stationChief),
      ).rejects.toThrow(ForbiddenException);
      await expect(service.restore(caseId, stationChief)).rejects.toThrow(
        ForbiddenException,
      );
      await expect(service.findDeleted(1, stationChief)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('returns 404 for a case that is already deleted', async () => {
      repository.softDelete.mockResolvedValue(false);

      await expect(
        service.remove(caseId, deletion, superAdmin),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
