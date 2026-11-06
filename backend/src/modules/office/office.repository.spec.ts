import { Test, TestingModule } from '@nestjs/testing';
import { type UUID } from 'crypto';
import { OfficeRepository } from './office.repository.js';
import { PrismaService } from '../../prisma.service.js';

const officeId = '11111111-1111-4111-8111-111111111111' as UUID;
const nhqId = '22222222-2222-4222-8222-222222222222';
const regionalId = '33333333-3333-4333-8333-333333333333';

const actorId = 'actor-1';

describe('OfficeRepository', () => {
  let repository: OfficeRepository;
  let prisma: {
    office: {
      findUnique: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
    };
    investigationCase: {
      findMany: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    investigationReferral: { create: ReturnType<typeof vi.fn> };
    $queryRaw: ReturnType<typeof vi.fn>;
    auditLog: { create: ReturnType<typeof vi.fn> };
    $transaction: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    prisma = {
      office: {
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        create: vi
          .fn()
          .mockImplementation(({ data }) =>
            Promise.resolve({ id: 'new-office', ...data }),
          ),
        update: vi
          .fn()
          .mockImplementation(({ data, where }) =>
            Promise.resolve({ id: where.id, ...data }),
          ),
        // No child offices unless a test says otherwise.
        findMany: vi.fn().mockResolvedValue([]),
        updateMany: vi.fn(),
      },
      // No referred cases unless a test says otherwise.
      investigationCase: {
        findMany: vi.fn().mockResolvedValue([]),
        update: vi.fn(),
      },
      investigationReferral: { create: vi.fn() },
      $queryRaw: vi.fn(),
      auditLog: { create: vi.fn() },
      $transaction: vi.fn(),
    };
    prisma.$transaction.mockImplementation((callback) => callback(prisma));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OfficeRepository,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    repository = module.get<OfficeRepository>(OfficeRepository);
  });

  describe('createOffice', () => {
    it('saves the region code of a regional office, trimmed and upper-cased', async () => {
      prisma.office.findUnique.mockResolvedValue({
        id: nhqId,
        type: 'NATIONAL_HEADQUARTERS',
        regionId: null,
      });

      await repository.createOffice(
        {
          name: 'Regional Office NCR',
          type: 'REGIONAL_OFFICE',
          parentId: nhqId,
          regionCode: ' ncr ',
        },
        actorId,
      );

      expect(prisma.office.create).toHaveBeenCalledWith({
        data: {
          name: 'Regional Office NCR',
          type: 'REGIONAL_OFFICE',
          parentId: nhqId,
          regionId: null,
          regionCode: 'NCR',
        },
      });
    });

    it('saves a null region code for non-regional offices', async () => {
      prisma.office.findUnique.mockResolvedValue({
        id: regionalId,
        type: 'REGIONAL_OFFICE',
        regionId: null,
      });

      await repository.createOffice(
        {
          name: 'Manila District Fire Station',
          type: 'DISTRICT_FIRE_STATION',
          parentId: regionalId,
          regionCode: '',
        },
        actorId,
      );

      expect(prisma.office.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          regionId: regionalId,
          regionCode: null,
        }),
      });
    });
  });

  describe('updateOffice', () => {
    describe('moving an office with referred cases (Q-51)', () => {
      const oldDistrict = 'old-district';
      const station = {
        id: officeId,
        name: 'Station',
        type: 'CITY_FIRE_STATION',
        parent: {
          id: 'new-district',
          name: 'New',
          type: 'DISTRICT_FIRE_STATION',
        },
        region: {
          id: regionalId,
          name: 'Region',
          type: 'REGIONAL_OFFICE',
          parent: { id: nhqId, name: 'NHQ', type: 'NATIONAL_HEADQUARTERS' },
        },
      };
      const referred = (overrides: Record<string, unknown>) => ({
        id: 'case-1',
        caseNo: 'INV-2026-10-NCR-000001',
        deletedAt: null,
        handlingOfficeId: oldDistrict,
        investigations: [],
        station,
        ...overrides,
      });
      const move = () =>
        repository.updateOffice(
          officeId,
          {
            name: 'Station',
            type: 'CITY_FIRE_STATION',
            parentId: 'new-district',
          },
          actorId,
        );

      beforeEach(() => {
        prisma.office.findUnique
          .mockResolvedValueOnce({
            id: 'new-district',
            type: 'DISTRICT_FIRE_STATION',
            regionId: regionalId,
          })
          .mockResolvedValueOnce({
            id: officeId,
            type: 'CITY_FIRE_STATION',
            parentId: oldDistrict,
            regionId: regionalId,
          });
      });

      it('blocks the move and names the unfinished case', async () => {
        prisma.investigationCase.findMany.mockResolvedValue([referred({})]);

        await expect(move()).rejects.toThrow('INV-2026-10-NCR-000001');
        expect(prisma.investigationReferral.create).not.toHaveBeenCalled();
        expect(prisma.auditLog.create).not.toHaveBeenCalled();
      });

      it('returns a completed case to the station and records it', async () => {
        prisma.investigationCase.findMany.mockResolvedValue([
          referred({
            investigations: [
              { conductingOfficeId: oldDistrict, completedAt: new Date() },
            ],
          }),
        ]);

        const result = await move();

        expect(prisma.investigationCase.update).toHaveBeenCalledWith({
          where: { id: 'case-1' },
          data: { handlingOfficeId: officeId },
        });
        expect(prisma.investigationReferral.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            fromOfficeId: oldDistrict,
            toOfficeId: officeId,
            direction: 'DOWN',
            referredById: actorId,
          }),
        });
        expect(result.returnedCases).toEqual([
          {
            caseId: 'case-1',
            caseNo: 'INV-2026-10-NCR-000001',
            stationId: officeId,
          },
        ]);
      });

      it('returns a hidden completed case without notifying about it', async () => {
        prisma.investigationCase.findMany.mockResolvedValue([
          referred({
            deletedAt: new Date(),
            investigations: [
              { conductingOfficeId: oldDistrict, completedAt: new Date() },
            ],
          }),
        ]);

        const result = await move();

        expect(prisma.investigationCase.update).toHaveBeenCalled();
        expect(result.returnedCases).toEqual([]);
      });
    });

    it('saves the region code on update', async () => {
      prisma.office.findUnique.mockResolvedValue({
        id: nhqId,
        type: 'NATIONAL_HEADQUARTERS',
        regionId: null,
      });

      await repository.updateOffice(
        officeId,
        {
          name: 'Regional Office NCR',
          type: 'REGIONAL_OFFICE',
          parentId: nhqId,
          regionCode: 'NCR',
        },
        actorId,
      );

      expect(prisma.office.update).toHaveBeenCalledWith({
        data: expect.objectContaining({ regionCode: 'NCR' }),
        where: { id: officeId },
      });
    });

    it('clears the region code when the office is no longer regional', async () => {
      prisma.office.findUnique.mockResolvedValue({
        id: regionalId,
        type: 'REGIONAL_OFFICE',
        regionId: null,
      });

      await repository.updateOffice(
        officeId,
        {
          name: 'Manila District Fire Station',
          type: 'DISTRICT_FIRE_STATION',
          parentId: regionalId,
        },
        actorId,
      );

      expect(prisma.office.update).toHaveBeenCalledWith({
        data: expect.objectContaining({ regionCode: null }),
        where: { id: officeId },
      });
    });

    it('re-regions every office below a re-parented office', async () => {
      const newRegionId = '44444444-4444-4444-8444-444444444444';
      const stationId = '55555555-5555-4555-8555-555555555555';

      prisma.office.findUnique.mockResolvedValue({
        id: newRegionId,
        type: 'REGIONAL_OFFICE',
        regionId: null,
      });
      prisma.office.findMany
        .mockResolvedValueOnce([
          { id: stationId, type: 'CITY_FIRE_STATION', parentId: officeId },
        ])
        .mockResolvedValueOnce([]);

      await repository.updateOffice(
        officeId,
        {
          name: 'Manila District Fire Station',
          type: 'DISTRICT_FIRE_STATION',
          parentId: newRegionId,
        },
        actorId,
      );

      expect(prisma.office.update).toHaveBeenCalledWith({
        data: expect.objectContaining({ regionId: newRegionId }),
        where: { id: officeId },
      });
      expect(prisma.office.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { parentId: { in: [officeId] } } }),
      );
      expect(prisma.office.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [stationId] } },
        data: { regionId: newRegionId },
      });
    });

    it('gives children of a regional office that region', async () => {
      const districtId = '55555555-5555-4555-8555-555555555555';

      prisma.office.findUnique.mockResolvedValue({
        id: nhqId,
        type: 'NATIONAL_HEADQUARTERS',
        regionId: null,
      });
      prisma.office.findMany
        .mockResolvedValueOnce([
          { id: districtId, type: 'DISTRICT_FIRE_STATION', parentId: officeId },
        ])
        .mockResolvedValueOnce([]);

      await repository.updateOffice(
        officeId,
        {
          name: 'Regional Office NCR',
          type: 'REGIONAL_OFFICE',
          parentId: nhqId,
          regionCode: 'NCR',
        },
        actorId,
      );

      expect(prisma.office.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [districtId] } },
        data: { regionId: officeId },
      });
    });
  });

  describe('findByNameUnderParent', () => {
    it('matches the name case-insensitively under the same parent, excluding the office itself', async () => {
      await repository.findByNameUnderParent(
        'quezon city fire station',
        regionalId,
        officeId,
      );

      expect(prisma.office.findFirst).toHaveBeenCalledWith({
        where: {
          name: { equals: 'quezon city fire station', mode: 'insensitive' },
          parentId: regionalId,
          id: { not: officeId },
        },
        select: { id: true },
      });
    });
  });

  describe('audit entries', () => {
    it('records a created office with its region', async () => {
      prisma.office.findUnique.mockResolvedValue({
        id: regionalId,
        type: 'REGIONAL_OFFICE',
        regionId: null,
      });

      await repository.createOffice(
        {
          name: 'Manila District Fire Station',
          type: 'DISTRICT_FIRE_STATION',
          parentId: regionalId,
        },
        actorId,
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          actorId,
          action: 'OFFICE_CREATED',
          entityType: 'OFFICE',
          entityId: 'new-office',
          officeId: 'new-office',
          regionId: regionalId,
        }),
      });
    });

    it('records only the fields that changed on update', async () => {
      prisma.office.findUnique.mockImplementation(({ where }) =>
        Promise.resolve(
          where.id === officeId
            ? {
                id: officeId,
                name: 'Old Name',
                type: 'DISTRICT_FIRE_STATION',
                parentId: regionalId,
                regionId: regionalId,
                regionCode: null,
              }
            : { id: regionalId, type: 'REGIONAL_OFFICE', regionId: null },
        ),
      );

      await repository.updateOffice(
        officeId,
        {
          name: 'New Name',
          type: 'DISTRICT_FIRE_STATION',
          parentId: regionalId,
        },
        actorId,
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'OFFICE_UPDATED',
          changes: { name: { from: 'Old Name', to: 'New Name' } },
        }),
      });
    });
  });
});
