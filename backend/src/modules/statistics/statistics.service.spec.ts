import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { type UUID } from 'crypto';
import { CSV_ROW_LIMIT, StatisticsService } from './statistics.service.js';
import { StatisticsRepository } from './statistics.repository.js';
import { type CurrentUserJwtPayload } from '../../types/jwt.payload.js';

const REGION = 'region-1';

const userWith = (
  role: CurrentUserJwtPayload['role'],
): CurrentUserJwtPayload => ({
  sub: '11111111-1111-4111-8111-111111111111' as UUID,
  account_number: 'ACC001',
  role,
  positionId: 'position-1',
  officeId: REGION,
});

const reportCase = (id: string) => ({
  id,
  caseNo: `INV-2026-03-NCR-00000${id}`,
  dateTimeFireIncident: null,
  createdAt: new Date('2026-03-15T00:00:00Z'),
  station: { name: 'QC Station' },
  handlingOffice: { name: 'QC Station' },
  category: { name: 'Residential', type: 'STRUCTURAL' },
  subcategory: null,
  location: null,
  impact: null,
  _count: { investigations: 1 },
  investigations: [],
});

describe('StatisticsService', () => {
  let service: StatisticsService;
  let repository: Record<string, ReturnType<typeof vi.fn>>;

  beforeEach(async () => {
    repository = {
      findOfficeType: vi
        .fn()
        .mockResolvedValue({ id: REGION, type: 'REGIONAL_OFFICE' }),
      findForSummary: vi.fn().mockResolvedValue([]),
      findReportPage: vi.fn().mockResolvedValue({ cases: [], total: 0 }),
      findReportRows: vi.fn().mockResolvedValue([]),
      findMapPoints: vi.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StatisticsService,
        { provide: StatisticsRepository, useValue: repository },
      ],
    }).compile();

    service = module.get<StatisticsService>(StatisticsService);
  });

  it('counts only non-deleted cases at stations in the viewer’s scope', async () => {
    await service.summary({}, userWith('REGIONAL_CHIEF_INVESTIGATOR'));

    expect(repository.findForSummary).toHaveBeenCalledWith({
      AND: [
        {
          deletedAt: null,
          station: {
            OR: [{ id: REGION }, { parentId: REGION }, { regionId: REGION }],
          },
        },
        {},
      ],
    });
  });

  it('filters on the fire date, or the creation date when it is blank', async () => {
    const from = new Date('2026-01-01T00:00:00Z');
    const to = new Date('2026-12-31T23:59:59Z');

    await service.summary(
      { from, to, state: 'OPEN', categoryType: 'STRUCTURAL' },
      userWith('SUPER_ADMIN'),
    );

    expect(repository.findForSummary.mock.calls[0][0].AND[1]).toEqual({
      investigations: { some: { completedAt: null } },
      category: { type: 'STRUCTURAL' },
      OR: [
        { dateTimeFireIncident: { gte: from, lte: to } },
        { dateTimeFireIncident: null, createdAt: { gte: from, lte: to } },
      ],
    });
  });

  it('forbids admins without case access', async () => {
    await expect(
      service.summary({}, userWith('REGIONAL_ADMIN')),
    ).rejects.toThrow(ForbiddenException);
  });

  it('paginates the report by 20', async () => {
    repository.findReportPage.mockResolvedValue({
      cases: [reportCase('1')],
      total: 41,
    });

    const result = await service.reportPage(
      { page: 3 },
      userWith('SUPER_ADMIN'),
    );

    expect(repository.findReportPage).toHaveBeenCalledWith(
      expect.anything(),
      40,
      20,
    );
    expect(result.pagination.totalPages).toBe(3);
    expect(result.data[0]).toMatchObject({
      caseNo: 'INV-2026-03-NCR-000001',
      state: 'OPEN',
      station: 'QC Station',
      fatalitiesCiv: 0,
    });
  });

  it('marks a CSV export that hit the row limit', async () => {
    repository.findReportRows.mockResolvedValue(
      Array.from({ length: CSV_ROW_LIMIT + 1 }, (_, i) =>
        reportCase(String(i)),
      ),
    );

    const { csv, truncated } = await service.reportCsv(
      {},
      userWith('SUPER_ADMIN'),
    );

    expect(repository.findReportRows).toHaveBeenCalledWith(
      expect.anything(),
      CSV_ROW_LIMIT + 1,
    );
    expect(truncated).toBe(true);
    // Header plus the limit, each ending in CRLF.
    expect(csv.split('\r\n').length - 1).toBe(CSV_ROW_LIMIT + 1);
  });

  it('returns map points with numeric coordinates', async () => {
    repository.findMapPoints.mockResolvedValue([
      {
        id: 'c-1',
        caseNo: 'INV-2026-03-NCR-000001',
        _count: { investigations: 0 },
        dateTimeFireIncident: null,
        createdAt: new Date('2026-03-15T00:00:00Z'),
        category: { name: 'Residential' },
        location: {
          latitude: { toString: () => '14.676' },
          longitude: { toString: () => '121.0437' },
          placeOfOccurence: '12 Rizal St.',
          barangay: 'San Isidro',
          city_municipality: 'Quezon City',
        },
      },
    ]);

    const [point] = await service.mapPoints({}, userWith('SUPER_ADMIN'));

    expect(point).toMatchObject({
      latitude: 14.676,
      longitude: 121.0437,
      state: 'CLOSED',
      place: '12 Rizal St., San Isidro, Quezon City',
    });
  });
});
