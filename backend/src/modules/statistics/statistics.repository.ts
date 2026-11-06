import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';

const namedOffice = { select: { id: true, name: true } } as const;

// The latest completed investigation is the one statistics use (FR-INV-019).
const latestInvestigation = {
  where: { completedAt: { not: null } },
  orderBy: { completedAt: 'desc' },
  take: 1,
  select: { investigationNo: true, classification: true, causeOfFire: true },
} as const;

const openCount = {
  _count: {
    select: { investigations: { where: { completedAt: null } } },
  },
} as const;

@Injectable()
export class StatisticsRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findOfficeType(officeId: string) {
    return this.prismaService.office.findUnique({
      where: { id: officeId },
      select: { id: true, type: true },
    });
  }

  async findForSummary(where: Prisma.InvestigationCaseWhereInput) {
    const cases = await this.prismaService.investigationCase.findMany({
      where,
      select: {
        id: true,
        dateTimeFireIncident: true,
        createdAt: true,
        station: {
          select: {
            id: true,
            name: true,
            parent: namedOffice,
            region: namedOffice,
          },
        },
        category: { select: { name: true, type: true } },
        impact: {
          select: {
            fatalitiesCiv: true,
            injuredCiv: true,
            fatalitiesBFP: true,
            injuredBFP: true,
            fatalitiesLEA: true,
            injuredLEA: true,
            establishmentsBurned: true,
            familiesAffected: true,
            individualsAffected: true,
            estimatedDamages: true,
            finalEstimatedDamages: true,
          },
        },
        ...openCount,
        investigations: latestInvestigation,
      },
    });

    return cases.map(({ _count, investigations, ...found }) => ({
      ...found,
      open: _count.investigations > 0,
      latestInvestigation: investigations[0] ?? null,
    }));
  }

  private readonly reportSelect = {
    id: true,
    caseNo: true,
    dateTimeFireIncident: true,
    createdAt: true,
    station: { select: { name: true } },
    handlingOffice: { select: { name: true } },
    category: { select: { name: true, type: true } },
    subcategory: { select: { name: true } },
    location: {
      select: {
        placeOfOccurence: true,
        barangay: true,
        city_municipality: true,
        province_district: true,
        region: true,
      },
    },
    impact: {
      select: {
        fatalitiesCiv: true,
        injuredCiv: true,
        fatalitiesBFP: true,
        injuredBFP: true,
        familiesAffected: true,
        estimatedDamages: true,
      },
    },
    ...openCount,
    investigations: latestInvestigation,
  } satisfies Prisma.InvestigationCaseSelect;

  // Newest fires first.
  private readonly reportOrder: Prisma.InvestigationCaseOrderByWithRelationInput[] =
    [
      { dateTimeFireIncident: { sort: 'desc', nulls: 'last' } },
      { createdAt: 'desc' },
    ];

  async findReportPage(
    where: Prisma.InvestigationCaseWhereInput,
    skip: number,
    take: number,
  ) {
    const [cases, total] = await Promise.all([
      this.prismaService.investigationCase.findMany({
        where,
        select: this.reportSelect,
        orderBy: this.reportOrder,
        skip,
        take,
      }),
      this.prismaService.investigationCase.count({ where }),
    ]);

    return { cases, total };
  }

  async findReportRows(
    where: Prisma.InvestigationCaseWhereInput,
    take: number,
  ) {
    return this.prismaService.investigationCase.findMany({
      where,
      select: this.reportSelect,
      orderBy: this.reportOrder,
      take,
    });
  }

  // Cases with coordinates, for the map.
  async findMapPoints(where: Prisma.InvestigationCaseWhereInput) {
    return this.prismaService.investigationCase.findMany({
      where: {
        AND: [
          where,
          {
            location: {
              latitude: { not: null },
              longitude: { not: null },
            },
          },
        ],
      },
      select: {
        id: true,
        caseNo: true,
        dateTimeFireIncident: true,
        createdAt: true,
        category: { select: { name: true } },
        location: {
          select: {
            latitude: true,
            longitude: true,
            placeOfOccurence: true,
            barangay: true,
            city_municipality: true,
          },
        },
        ...openCount,
      },
    });
  }
}

export type ReportCase = Awaited<
  ReturnType<StatisticsRepository['findReportRows']>
>[number];
