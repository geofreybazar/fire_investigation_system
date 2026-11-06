import { Test, TestingModule } from '@nestjs/testing';
import { CaseRepository } from './case.repository.js';
import { PrismaService } from '../../prisma.service.js';

const caseId = '11111111-1111-4111-8111-111111111111';
const investigationId = '22222222-2222-4222-8222-222222222222';
const actorId = '33333333-3333-4333-8333-333333333333';

const lockedCase = (overrides: Record<string, unknown> = {}) => ({
  deletedAt: null,
  handlingOfficeId: 'station-1',
  _count: { investigations: 0 },
  ...overrides,
});

describe('CaseRepository', () => {
  let repository: CaseRepository;
  let tx: {
    $queryRaw: ReturnType<typeof vi.fn>;
    investigationCase: Record<string, ReturnType<typeof vi.fn>>;
    investigation: Record<string, ReturnType<typeof vi.fn>>;
    investigationReferral: { create: ReturnType<typeof vi.fn> };
    incidentNumberCounter: { upsert: ReturnType<typeof vi.fn> };
    auditLog: { create: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    tx = {
      $queryRaw: vi.fn().mockResolvedValue([]),
      investigationCase: {
        findUnique: vi.fn().mockResolvedValue(lockedCase()),
        findUniqueOrThrow: vi.fn().mockResolvedValue({
          caseNo: 'INV-2026-11-NCR-000007',
          _count: { investigations: 1 },
        }),
        create: vi.fn().mockResolvedValue({
          id: caseId,
          caseNo: 'INV-2026-11-NCR-000007',
          investigations: [],
        }),
        update: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      investigation: {
        create: vi.fn().mockResolvedValue({ id: investigationId }),
      },
      investigationReferral: { create: vi.fn() },
      incidentNumberCounter: {
        upsert: vi.fn().mockResolvedValue({ lastNumber: 7 }),
      },
      auditLog: { create: vi.fn() },
    };
    const prisma = {
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) =>
        callback(tx),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CaseRepository, { provide: PrismaService, useValue: prisma }],
    }).compile();

    repository = module.get<CaseRepository>(CaseRepository);
  });

  describe('create', () => {
    it('numbers the case from the region counter and opens investigation -01 at the creating office', async () => {
      await repository.create({
        station: { id: 'station-1', regionCode: 'ncr' },
        createdByOfficeId: 'district-1',
        createdById: actorId,
        categoryId: 'category-1',
        location: {
          placeOfOccurence: '12 Rizal St',
          barangay: 'Poblacion',
          region: 'NCR',
          province_district: 'District 1',
          city_municipality: 'Station 1',
        },
        assignedInvestigatorId: 'investigator-1',
      });

      expect(tx.incidentNumberCounter.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            year_month_regionCode: expect.objectContaining({
              regionCode: 'NCR',
            }),
          },
        }),
      );

      const { data } = tx.investigationCase.create.mock.calls[0][0];
      expect(data.caseNo).toMatch(/^INV-\d{4}-\d{2}-NCR-000007$/);
      expect(data.stationId).toBe('station-1');
      expect(data.handlingOfficeId).toBe('district-1');
      expect(data.investigations.create).toEqual(
        expect.objectContaining({
          investigationNo: `${data.caseNo}-01`,
          conductingOfficeId: 'district-1',
          assignedInvestigatorId: 'investigator-1',
          assignedById: actorId,
        }),
      );
    });
  });

  const referral = {
    fromOfficeId: 'station-1',
    toOfficeId: 'region-1',
    direction: 'UP' as const,
    referredById: actorId,
  };

  describe('refer', () => {
    it('locks the case, moves it and records the referral', async () => {
      await expect(repository.refer(caseId, referral)).resolves.toBe(true);

      expect(tx.$queryRaw).toHaveBeenCalled();
      expect(tx.investigationCase.update).toHaveBeenCalledWith({
        where: { id: caseId },
        data: { handlingOfficeId: 'region-1' },
      });
      expect(tx.investigationReferral.create).toHaveBeenCalledWith({
        data: { caseId, ...referral },
      });
    });

    it.each([
      ['an investigation is open', { _count: { investigations: 1 } }],
      ['the case already moved', { handlingOfficeId: 'district-1' }],
      ['the case was deleted', { deletedAt: new Date() }],
    ])('refuses when %s', async (_label, overrides) => {
      tx.investigationCase.findUnique.mockResolvedValue(lockedCase(overrides));

      await expect(repository.refer(caseId, referral)).resolves.toBe(false);
      expect(tx.investigationReferral.create).not.toHaveBeenCalled();
    });
  });

  describe('start', () => {
    const data = {
      conductingOfficeId: 'station-1',
      assignedInvestigatorId: 'investigator-1',
      assignedById: actorId,
    };

    it('numbers the new investigation from the case number and count', async () => {
      await repository.start(caseId, data);

      expect(tx.investigation.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          investigationNo: 'INV-2026-11-NCR-000007-02',
          caseId,
          conductingOfficeId: 'station-1',
          assignedInvestigatorId: 'investigator-1',
          startedAt: expect.any(Date),
        }),
        select: { id: true, investigationNo: true },
      });
    });

    it('refuses while another investigation is open', async () => {
      tx.investigationCase.findUnique.mockResolvedValue(
        lockedCase({ _count: { investigations: 1 } }),
      );

      await expect(repository.start(caseId, data)).resolves.toBeNull();
      expect(tx.investigation.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('refuses once an investigation of the case is completed', async () => {
      tx.investigationCase.findUnique.mockResolvedValue({
        deletedAt: null,
        _count: { investigations: 1 },
      });

      await expect(repository.update(caseId, { remarks: 'x' })).resolves.toBe(
        false,
      );
      expect(tx.investigationCase.update).not.toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('hides the case and audits the deletion', async () => {
      tx.investigationCase.findUnique.mockResolvedValue({
        stationId: 'station-1',
        station: { regionId: 'region-1' },
      });

      await expect(
        repository.softDelete(caseId, actorId, {
          reason: 'Duplicate',
          memoReference: 'MEMO-1',
        }),
      ).resolves.toBe(true);

      expect(tx.investigationCase.updateMany).toHaveBeenCalledWith({
        where: { id: caseId, deletedAt: null },
        data: expect.objectContaining({
          deletedById: actorId,
          deletionReason: 'Duplicate',
          deletionMemoReference: 'MEMO-1',
        }),
      });
      expect(tx.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: 'CASE_DELETED',
          entityType: 'INVESTIGATION_CASE',
          entityId: caseId,
          officeId: 'station-1',
          regionId: 'region-1',
        }),
      });
    });

    it('does nothing to a case that is already deleted', async () => {
      tx.investigationCase.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        repository.softDelete(caseId, actorId, {
          reason: 'Duplicate',
          memoReference: 'MEMO-1',
        }),
      ).resolves.toBe(false);
      expect(tx.auditLog.create).not.toHaveBeenCalled();
    });
  });
});
