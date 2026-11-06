import {
  CATEGORY_TYPE,
  CauseOfFire,
  FireCaseClassification,
  OfficeType,
} from '../../../generated/prisma/enums.js';

// Pure aggregation for the statistics endpoints (REQUIREMENTS.md Q-20).
// Callers pass only non-deleted cases within the viewer's scope.

interface NamedOffice {
  id: string;
  name: string;
}

// Decimal columns arrive as Prisma Decimal objects; anything with toString.
type DecimalLike = { toString(): string } | null;

export interface StatisticsCase {
  id: string;
  dateTimeFireIncident: Date | null;
  createdAt: Date;
  station: NamedOffice & {
    parent: NamedOffice | null;
    region: NamedOffice | null;
  };
  category: { name: string; type: CATEGORY_TYPE };
  impact: {
    fatalitiesCiv: number;
    injuredCiv: number;
    fatalitiesBFP: number;
    injuredBFP: number;
    fatalitiesLEA: number;
    injuredLEA: number;
    establishmentsBurned: number;
    familiesAffected: number;
    individualsAffected: number;
    estimatedDamages: DecimalLike;
    finalEstimatedDamages: DecimalLike;
  } | null;
  // Has an investigation in progress.
  open: boolean;
  // The latest completed investigation, which is the one statistics use.
  latestInvestigation: {
    classification: FireCaseClassification | null;
    causeOfFire: CauseOfFire | null;
  } | null;
}

export interface Bucket {
  key: string;
  label: string;
  count: number;
}

const IMPACT_FIELDS = [
  'fatalitiesCiv',
  'injuredCiv',
  'fatalitiesBFP',
  'injuredBFP',
  'fatalitiesLEA',
  'injuredLEA',
  'establishmentsBurned',
  'familiesAffected',
  'individualsAffected',
] as const;

export const fireDate = (found: StatisticsCase) =>
  found.dateTimeFireIncident ?? found.createdAt;

// YYYY-MM of a date in Philippine time, like the case numbers.
export function manilaMonth(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date);
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
}

// Cases are grouped by the offices directly below the viewer: regions for
// NHQ, districts/provinces for a region, stations below that.
export function officeGroup(
  found: StatisticsCase,
  viewerOfficeType: OfficeType,
): NamedOffice {
  const { station: office } = found;

  switch (viewerOfficeType) {
    case OfficeType.NATIONAL_HEADQUARTERS:
      return office.region ?? office;
    case OfficeType.REGIONAL_OFFICE:
      return office.parent ?? office;
    default:
      return office;
  }
}

const label = (key: string) =>
  key
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

// Counts per key, largest first unless an order is given.
function countBy(
  cases: StatisticsCase[],
  keyOf: (found: StatisticsCase) => { key: string; label: string } | null,
  order?: string[],
): Bucket[] {
  const buckets = new Map<string, Bucket>();

  for (const found of cases) {
    const group = keyOf(found);
    if (!group) continue;

    const bucket = buckets.get(group.key) ?? { ...group, count: 0 };
    bucket.count += 1;
    buckets.set(group.key, bucket);
  }

  const result = [...buckets.values()];

  if (order) {
    return result.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  }

  return result.sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
}

const enumKey = (key: string) => ({ key, label: label(key) });

const toNumber = (value: DecimalLike) => (value ? Number(value.toString()) : 0);

export function summarize(
  cases: StatisticsCase[],
  viewerOfficeType: OfficeType,
) {
  const impact = Object.fromEntries(
    IMPACT_FIELDS.map((field) => [
      field,
      cases.reduce((sum, found) => sum + (found.impact?.[field] ?? 0), 0),
    ]),
  ) as Record<(typeof IMPACT_FIELDS)[number], number>;

  const investigated = cases.filter((found) => found.latestInvestigation);

  return {
    totals: {
      cases: cases.length,
      open: cases.filter((found) => found.open).length,
      // Cases with at least one completed (approved) investigation.
      investigated: investigated.length,
    },
    impact: {
      ...impact,
      estimatedDamages: cases.reduce(
        (sum, found) => sum + toNumber(found.impact?.estimatedDamages ?? null),
        0,
      ),
      finalEstimatedDamages: cases.reduce(
        (sum, found) =>
          sum + toNumber(found.impact?.finalEstimatedDamages ?? null),
        0,
      ),
    },
    byCategoryType: countBy(cases, (found) => enumKey(found.category.type)),
    byCategory: countBy(cases, (found) => ({
      key: found.category.name,
      label: found.category.name,
    })),
    byMonth: countBy(cases, (found) => {
      const month = manilaMonth(fireDate(found));
      return { key: month, label: month };
    }).sort((a, b) => a.key.localeCompare(b.key)),
    byOffice: countBy(cases, (found) => {
      const office = officeGroup(found, viewerOfficeType);
      return { key: office.id, label: office.name };
    }),
    byCause: countBy(investigated, (found) =>
      found.latestInvestigation?.causeOfFire
        ? enumKey(found.latestInvestigation.causeOfFire)
        : null,
    ),
    byClassification: countBy(investigated, (found) =>
      found.latestInvestigation?.classification
        ? enumKey(found.latestInvestigation.classification)
        : null,
    ),
  };
}

export type StatisticsSummary = ReturnType<typeof summarize>;
