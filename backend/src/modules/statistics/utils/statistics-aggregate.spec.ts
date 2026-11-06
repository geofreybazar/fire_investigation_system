import {
  manilaMonth,
  officeGroup,
  summarize,
  type StatisticsCase,
} from './statistics-aggregate.js';

const station = { id: 'st-1', name: 'QC Station' };
const district = { id: 'd-1', name: 'QC District' };
const region = { id: 'r-1', name: 'NCR' };

const incident = (overrides: Partial<StatisticsCase> = {}): StatisticsCase => ({
  id: 'i-1',
  dateTimeFireIncident: new Date('2026-03-15T02:00:00Z'),
  createdAt: new Date('2026-03-15T03:00:00Z'),
  station: { ...station, parent: district, region },
  category: { name: 'Residential', type: 'STRUCTURAL' },
  impact: null,
  open: false,
  latestInvestigation: null,
  ...overrides,
});

const impact = (fatalitiesCiv: number, damages: string | null) => ({
  fatalitiesCiv,
  injuredCiv: 1,
  fatalitiesBFP: 0,
  injuredBFP: 0,
  fatalitiesLEA: 0,
  injuredLEA: 0,
  establishmentsBurned: 1,
  familiesAffected: 2,
  individualsAffected: 5,
  estimatedDamages: damages === null ? null : { toString: () => damages },
  finalEstimatedDamages: null,
});

describe('statistics aggregation', () => {
  it('counts cases, open cases and investigated cases', () => {
    const result = summarize(
      [
        incident(),
        incident({ id: 'i-2', open: true }),
        incident({
          id: 'i-3',
          open: true,
          latestInvestigation: {
            classification: 'ACCIDENTAL',
            causeOfFire: 'OPEN_FLAME_FROM_COOKING',
          },
        }),
      ],
      'NATIONAL_HEADQUARTERS',
    );

    expect(result.totals).toEqual({ cases: 3, open: 2, investigated: 1 });
  });

  it('sums impact and damages, treating missing impact as zero', () => {
    const result = summarize(
      [
        incident({ impact: impact(2, '150000.50') }),
        incident({ id: 'i-2', impact: impact(1, null) }),
        incident({ id: 'i-3' }),
      ],
      'NATIONAL_HEADQUARTERS',
    );

    expect(result.impact).toMatchObject({
      fatalitiesCiv: 3,
      injuredCiv: 2,
      familiesAffected: 4,
      estimatedDamages: 150000.5,
      finalEstimatedDamages: 0,
    });
  });

  it('counts by category, largest first', () => {
    const result = summarize(
      [
        incident(),
        incident({ id: 'i-2' }),
        incident({
          id: 'i-3',
          category: { name: 'Grass', type: 'WILDLAND' },
        }),
      ],
      'NATIONAL_HEADQUARTERS',
    );

    expect(result.byCategory.map((bucket) => bucket.key)).toEqual([
      'Residential',
      'Grass',
    ]);
    expect(result.byCategoryType).toEqual([
      { key: 'STRUCTURAL', label: 'Structural', count: 2 },
      { key: 'WILDLAND', label: 'Wildland', count: 1 },
    ]);
  });

  it('groups by month in Philippine time, falling back to the creation date', () => {
    const result = summarize(
      [
        // 2026-03-31 20:00 UTC is already April 1 in Manila.
        incident({ dateTimeFireIncident: new Date('2026-03-31T20:00:00Z') }),
        incident({
          id: 'i-2',
          dateTimeFireIncident: null,
          createdAt: new Date('2026-02-10T00:00:00Z'),
        }),
      ],
      'NATIONAL_HEADQUARTERS',
    );

    expect(result.byMonth.map((bucket) => bucket.key)).toEqual([
      '2026-02',
      '2026-04',
    ]);
  });

  it('uses only the latest completed investigation for causes', () => {
    const result = summarize(
      [
        incident({
          latestInvestigation: {
            classification: 'ACCIDENTAL',
            causeOfFire: 'OPEN_FLAME_FROM_COOKING',
          },
        }),
        incident({ id: 'i-2' }),
      ],
      'NATIONAL_HEADQUARTERS',
    );

    expect(result.totals.investigated).toBe(1);
    expect(result.byCause).toEqual([
      {
        key: 'OPEN_FLAME_FROM_COOKING',
        label: 'Open Flame From Cooking',
        count: 1,
      },
    ]);
    expect(result.byClassification).toEqual([
      { key: 'ACCIDENTAL', label: 'Accidental', count: 1 },
    ]);
  });

  describe('officeGroup', () => {
    it.each([
      ['NATIONAL_HEADQUARTERS', region],
      ['REGIONAL_OFFICE', district],
      ['DISTRICT_FIRE_STATION', station],
      ['CITY_FIRE_STATION', station],
    ] as const)(
      'groups a %s viewer by the office below it',
      (type, expected) => {
        expect(officeGroup(incident(), type)).toMatchObject(expected);
      },
    );
  });

  it('formats months as YYYY-MM in Manila time', () => {
    expect(manilaMonth(new Date('2025-12-31T16:30:00Z'))).toBe('2026-01');
  });
});
