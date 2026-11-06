import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { caseScopeWhere } from '../investigation/utils/case-scope.js';
import {
  StatisticsRepository,
  type ReportCase,
} from './statistics.repository.js';
import {
  type ReportQuery,
  type StatisticsQuery,
} from './schema/statistics.schema.js';
import { summarize } from './utils/statistics-aggregate.js';
import { toCsv } from './utils/csv.js';

const REPORT_PAGE_SIZE = 20;

// A CSV export is a report, not a backup: beyond this many rows, narrow the
// filters. The response says when it was cut off.
export const CSV_ROW_LIMIT = 10_000;

const CSV_HEADERS = [
  'Case No.',
  'Fire date',
  'State',
  'Latest completed investigation',
  'Category type',
  'Category',
  'Subcategory',
  'Place of occurrence',
  'Barangay',
  'City/Municipality',
  'Province/District',
  'Region',
  'Station',
  'Handling office',
  'Civilian fatalities',
  'Civilian injured',
  'BFP fatalities',
  'BFP injured',
  'Families affected',
  'Estimated damages (PHP)',
  'Classification',
  'Cause of fire',
];

@Injectable()
export class StatisticsService {
  constructor(private readonly statisticsRepository: StatisticsRepository) {}

  async summary(query: StatisticsQuery, user: CurrentUserJwtPayload) {
    const { where, officeType } = await this.scopedWhere(query, user);
    const cases = await this.statisticsRepository.findForSummary(where);

    return summarize(cases, officeType);
  }

  async reportPage(query: ReportQuery, user: CurrentUserJwtPayload) {
    const { where } = await this.scopedWhere(query, user);
    const skip = (query.page - 1) * REPORT_PAGE_SIZE;
    const { cases, total } = await this.statisticsRepository.findReportPage(
      where,
      skip,
      REPORT_PAGE_SIZE,
    );

    return {
      data: cases.map(toReportRow),
      pagination: {
        page: query.page,
        limit: REPORT_PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / REPORT_PAGE_SIZE),
      },
    };
  }

  async reportCsv(query: StatisticsQuery, user: CurrentUserJwtPayload) {
    const { where } = await this.scopedWhere(query, user);
    // One extra row tells whether the limit cut the export short.
    const cases = await this.statisticsRepository.findReportRows(
      where,
      CSV_ROW_LIMIT + 1,
    );
    const truncated = cases.length > CSV_ROW_LIMIT;

    const rows = cases.slice(0, CSV_ROW_LIMIT).map((found) => {
      const row = toReportRow(found);
      return [
        row.caseNo,
        row.fireDate,
        row.state,
        row.investigationNo,
        row.categoryType,
        row.category,
        row.subcategory,
        row.placeOfOccurence,
        row.barangay,
        row.cityMunicipality,
        row.provinceDistrict,
        row.region,
        row.station,
        row.handlingOffice,
        row.fatalitiesCiv,
        row.injuredCiv,
        row.fatalitiesBFP,
        row.injuredBFP,
        row.familiesAffected,
        row.estimatedDamages,
        row.classification,
        row.causeOfFire,
      ];
    });

    return { csv: toCsv(CSV_HEADERS, rows), truncated };
  }

  async mapPoints(query: StatisticsQuery, user: CurrentUserJwtPayload) {
    const { where } = await this.scopedWhere(query, user);
    const cases = await this.statisticsRepository.findMapPoints(where);

    return cases.map((found) => ({
      id: found.id,
      caseNo: found.caseNo,
      state: found._count.investigations > 0 ? 'OPEN' : 'CLOSED',
      fireDate: found.dateTimeFireIncident ?? found.createdAt,
      category: found.category.name,
      latitude: Number(found.location?.latitude),
      longitude: Number(found.location?.longitude),
      place: found.location
        ? `${found.location.placeOfOccurence}, ${found.location.barangay}, ${found.location.city_municipality}`
        : null,
    }));
  }

  // Non-deleted cases within the viewer's scope (Q-20).
  private async scopedWhere(
    query: StatisticsQuery,
    user: CurrentUserJwtPayload,
  ) {
    const office = await this.statisticsRepository.findOfficeType(
      user.officeId,
    );

    if (!office) {
      throw new ForbiddenException('Your office was not found.');
    }

    const range =
      query.from || query.to
        ? {
            ...(query.from && { gte: query.from }),
            ...(query.to && { lte: query.to }),
          }
        : undefined;

    const where: Prisma.InvestigationCaseWhereInput = {
      AND: [
        caseScopeWhere({ user, officeType: office.type }),
        {
          ...(query.state === 'OPEN' && {
            investigations: { some: { completedAt: null } },
          }),
          ...(query.state === 'CLOSED' && {
            investigations: { none: { completedAt: null } },
          }),
          ...(query.categoryType && {
            category: { type: query.categoryType },
          }),
          // The fire's date, or the creation date when it was left blank.
          ...(range && {
            OR: [
              { dateTimeFireIncident: range },
              { dateTimeFireIncident: null, createdAt: range },
            ],
          }),
        },
      ],
    };

    return { where, officeType: office.type };
  }
}

function toReportRow(found: ReportCase) {
  const investigation = found.investigations[0] ?? null;

  return {
    id: found.id,
    caseNo: found.caseNo,
    fireDate: found.dateTimeFireIncident ?? found.createdAt,
    state: found._count.investigations > 0 ? 'OPEN' : 'CLOSED',
    investigationNo: investigation?.investigationNo ?? null,
    categoryType: found.category.type,
    category: found.category.name,
    subcategory: found.subcategory?.name ?? null,
    placeOfOccurence: found.location?.placeOfOccurence ?? null,
    barangay: found.location?.barangay ?? null,
    cityMunicipality: found.location?.city_municipality ?? null,
    provinceDistrict: found.location?.province_district ?? null,
    region: found.location?.region ?? null,
    station: found.station.name,
    handlingOffice: found.handlingOffice.name,
    fatalitiesCiv: found.impact?.fatalitiesCiv ?? 0,
    injuredCiv: found.impact?.injuredCiv ?? 0,
    fatalitiesBFP: found.impact?.fatalitiesBFP ?? 0,
    injuredBFP: found.impact?.injuredBFP ?? 0,
    familiesAffected: found.impact?.familiesAffected ?? 0,
    estimatedDamages: found.impact?.estimatedDamages
      ? Number(found.impact.estimatedDamages.toString())
      : null,
    classification: investigation?.classification ?? null,
    causeOfFire: investigation?.causeOfFire ?? null,
  };
}
