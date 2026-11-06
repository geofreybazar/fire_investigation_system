import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { ReferralDirection } from '../../generated/prisma/enums.js';
import { recordAudit } from '../audit/audit.writer.js';
import { generateCaseNumber } from './utils/generate-case-number.js';
import {
  INVESTIGATOR_ROLES,
  investigationNumber,
} from './utils/investigation-rules.js';

// Users are only ever exposed by name.
const userSummary = {
  select: { id: true, rank: true, first_name: true, last_name: true },
} as const;

const officeSummary = {
  select: { id: true, name: true, type: true },
} as const;

// An investigation is open while it is assigned and its report not approved.
const open = { completedAt: null } as const;

// The station with the offices its chain and location are built from.
const stationWithChain = {
  select: {
    id: true,
    name: true,
    type: true,
    parentId: true,
    regionId: true,
    parent: officeSummary,
    region: {
      select: {
        id: true,
        name: true,
        type: true,
        regionCode: true,
        parent: officeSummary,
      },
    },
  },
} as const;

const listSelect = {
  id: true,
  caseNo: true,
  dateTimeFireIncident: true,
  createdAt: true,
  updatedAt: true,
  category: { select: { id: true, name: true } },
  subcategory: { select: { id: true, name: true } },
  station: officeSummary,
  handlingOffice: officeSummary,
  location: {
    select: {
      placeOfOccurence: true,
      barangay: true,
      city_municipality: true,
      province_district: true,
      region: true,
    },
  },
  investigations: {
    orderBy: { startedAt: 'desc' },
    take: 1,
    select: {
      id: true,
      investigationNo: true,
      completedAt: true,
      report: { select: { status: true } },
    },
  },
} satisfies Prisma.InvestigationCaseSelect;

export interface NewCase {
  station: { id: string; regionCode: string };
  createdByOfficeId: string;
  createdById: string;
  categoryId: string;
  subcategoryId?: string | null;
  establishmentId?: string | null;
  dateTimeFireIncident?: Date | null;
  dateTimeReported?: Date | null;
  dateTimeCallReceived?: Date | null;
  remarks?: string | null;
  location: Prisma.CaseLocationCreateWithoutCaseInput;
  impact?: Prisma.CaseImpactCreateWithoutCaseInput;
  assignedInvestigatorId: string;
}

// The case station and its region, for an audit entry's scope.
async function caseAuditScope(tx: Prisma.TransactionClient, id: string) {
  const found = await tx.investigationCase.findUnique({
    where: { id },
    select: { stationId: true, station: { select: { regionId: true } } },
  });

  return {
    officeId: found?.stationId ?? null,
    regionId: found?.station.regionId ?? null,
  };
}

@Injectable()
export class CaseRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findOfficeType(officeId: string) {
    return this.prismaService.office.findUnique({
      where: { id: officeId },
      select: { id: true, type: true },
    });
  }

  async findStation(stationId: string) {
    return this.prismaService.office.findUnique({
      where: { id: stationId },
      select: { ...stationWithChain.select, isActive: true },
    });
  }

  // Active city/municipal stations matching `where`, for the case form.
  async findStations(where: Prisma.OfficeWhereInput) {
    return this.prismaService.office.findMany({
      where: {
        AND: [
          where,
          {
            isActive: true,
            type: { in: ['CITY_FIRE_STATION', 'MUNICIPAL_FIRE_STATION'] },
          },
        ],
      },
      select: {
        id: true,
        name: true,
        type: true,
        parent: { select: { name: true } },
        region: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findCategory(categoryId: string) {
    return this.prismaService.fireIncidentCategory.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
  }

  async findSubcategory(subcategoryId: string) {
    return this.prismaService.fireIncidentSubcategory.findUnique({
      where: { id: subcategoryId },
      select: { id: true, categoryId: true },
    });
  }

  async findEstablishment(establishmentId: string) {
    return this.prismaService.establishment.findUnique({
      where: { id: establishmentId },
      select: { id: true },
    });
  }

  async findUser(userId: string) {
    return this.prismaService.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, isActive: true, officeId: true },
    });
  }

  // Active investigators of an office, for the chief to assign.
  async findInvestigators(officeId: string) {
    return this.prismaService.user.findMany({
      where: { officeId, isActive: true, role: { in: INVESTIGATOR_ROLES } },
      select: { ...userSummary.select, role: true },
      orderBy: { last_name: 'asc' },
    });
  }

  // Case, location, impact and its first investigation in one transaction,
  // with the case number drawn from the region's counter.
  async create(data: NewCase) {
    const { station, location, impact, assignedInvestigatorId, ...fields } =
      data;

    return this.prismaService.$transaction(async (tx) => {
      const caseNo = await generateCaseNumber(tx, station.regionCode);

      return tx.investigationCase.create({
        data: {
          ...fields,
          caseNo,
          stationId: station.id,
          handlingOfficeId: fields.createdByOfficeId,
          location: { create: location },
          impact: { create: impact ?? {} },
          investigations: {
            create: {
              investigationNo: investigationNumber(caseNo, 0),
              conductingOfficeId: fields.createdByOfficeId,
              assignedInvestigatorId,
              assignedById: fields.createdById,
              startedAt: new Date(),
            },
          },
        },
        select: {
          id: true,
          caseNo: true,
          investigations: { select: { id: true, investigationNo: true } },
        },
      });
    });
  }

  async findPaginated(
    where: Prisma.InvestigationCaseWhereInput,
    skip: number,
    take: number,
  ) {
    const [cases, total] = await Promise.all([
      this.prismaService.investigationCase.findMany({
        where,
        select: listSelect,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prismaService.investigationCase.count({ where }),
    ]);

    return { cases, total };
  }

  async findDeletedPaginated(skip: number, take: number) {
    const where: Prisma.InvestigationCaseWhereInput = {
      deletedAt: { not: null },
    };

    const [cases, total] = await Promise.all([
      this.prismaService.investigationCase.findMany({
        where,
        select: {
          ...listSelect,
          deletedAt: true,
          deletionReason: true,
          deletionMemoReference: true,
          deletedBy: userSummary,
        },
        orderBy: { deletedAt: 'desc' },
        skip,
        take,
      }),
      this.prismaService.investigationCase.count({ where }),
    ]);

    return { cases, total };
  }

  // The fields every access and workflow decision needs, with the station chain.
  async findForAccess(id: string) {
    return this.prismaService.investigationCase.findUnique({
      where: { id },
      select: {
        id: true,
        caseNo: true,
        deletedAt: true,
        createdById: true,
        categoryId: true,
        handlingOfficeId: true,
        station: stationWithChain,
      },
    });
  }

  async findDetail(id: string) {
    const [found, referrals, investigations] = await Promise.all([
      this.prismaService.investigationCase.findUnique({
        where: { id },
        include: {
          category: { select: { id: true, name: true, type: true } },
          subcategory: { select: { id: true, name: true } },
          establishment: true,
          station: officeSummary,
          createdByOffice: officeSummary,
          handlingOffice: officeSummary,
          createdBy: userSummary,
          location: true,
          impact: true,
        },
      }),
      this.prismaService.investigationReferral.findMany({
        where: { caseId: id },
        orderBy: { createdAt: 'asc' },
        include: {
          fromOffice: officeSummary,
          toOffice: officeSummary,
          referredBy: userSummary,
        },
      }),
      this.prismaService.investigation.findMany({
        where: { caseId: id },
        orderBy: { startedAt: 'asc' },
        include: {
          conductingOffice: officeSummary,
          assignedInvestigator: userSummary,
          assignedBy: userSummary,
          report: { select: { status: true } },
        },
      }),
    ]);

    return found ? { ...found, referrals, investigations } : null;
  }

  // Updates the case fields. Returns false if, once locked, the case is
  // deleted or one of its investigations has been completed.
  async update(
    id: string,
    data: Prisma.InvestigationCaseUpdateInput,
  ): Promise<boolean> {
    return this.prismaService.$transaction(async (tx) => {
      await this.lockCase(tx, id);

      const current = await tx.investigationCase.findUnique({
        where: { id },
        select: {
          deletedAt: true,
          _count: {
            select: {
              investigations: { where: { completedAt: { not: null } } },
            },
          },
        },
      });

      if (
        !current ||
        current.deletedAt !== null ||
        current._count.investigations > 0
      ) {
        return false;
      }

      await tx.investigationCase.update({ where: { id }, data });
      return true;
    });
  }

  // Moves the case to another office. Returns false if, once locked, the case
  // has an open investigation or is no longer at `fromOfficeId`.
  async refer(
    caseId: string,
    referral: {
      fromOfficeId: string;
      toOfficeId: string;
      direction: ReferralDirection;
      referredById: string;
      remarks?: string | null;
    },
  ) {
    return this.prismaService.$transaction(async (tx) => {
      if (
        !(await this.isUnchangedAndClosed(tx, caseId, referral.fromOfficeId))
      ) {
        return false;
      }

      await tx.investigationCase.update({
        where: { id: caseId },
        data: { handlingOfficeId: referral.toOfficeId },
      });
      await tx.investigationReferral.create({
        data: { caseId, ...referral },
      });

      return true;
    });
  }

  // Starts (creates and assigns) a further investigation. Returns null if,
  // once locked, the case has an open investigation or moved to another office.
  async start(
    caseId: string,
    investigation: {
      conductingOfficeId: string;
      assignedInvestigatorId: string;
      assignedById: string;
    },
  ) {
    return this.prismaService.$transaction(async (tx) => {
      if (
        !(await this.isUnchangedAndClosed(
          tx,
          caseId,
          investigation.conductingOfficeId,
        ))
      ) {
        return null;
      }

      const current = await tx.investigationCase.findUniqueOrThrow({
        where: { id: caseId },
        select: { caseNo: true, _count: { select: { investigations: true } } },
      });

      return tx.investigation.create({
        data: {
          investigationNo: investigationNumber(
            current.caseNo,
            current._count.investigations,
          ),
          caseId,
          ...investigation,
          startedAt: new Date(),
        },
        select: { id: true, investigationNo: true },
      });
    });
  }

  // SUPER_ADMIN soft delete; returns false if already deleted or missing.
  async softDelete(
    id: string,
    actorId: string,
    deletion: { reason: string; memoReference: string },
  ) {
    return this.prismaService.$transaction(async (tx) => {
      const { count } = await tx.investigationCase.updateMany({
        where: { id, deletedAt: null },
        data: {
          deletedAt: new Date(),
          deletedById: actorId,
          deletionReason: deletion.reason,
          deletionMemoReference: deletion.memoReference,
        },
      });

      if (count === 0) {
        return false;
      }

      await recordAudit(tx, {
        actorId,
        action: 'CASE_DELETED',
        entityType: 'INVESTIGATION_CASE',
        entityId: id,
        ...(await caseAuditScope(tx, id)),
        changes: {
          reason: deletion.reason,
          memoReference: deletion.memoReference,
        },
      });

      return true;
    });
  }

  async restore(id: string, actorId: string) {
    return this.prismaService.$transaction(async (tx) => {
      const deleted = await tx.investigationCase.findUnique({
        where: { id },
        select: {
          deletedAt: true,
          deletionReason: true,
          deletionMemoReference: true,
        },
      });

      const { count } = await tx.investigationCase.updateMany({
        where: { id, deletedAt: { not: null } },
        data: {
          deletedAt: null,
          deletedById: null,
          deletionReason: null,
          deletionMemoReference: null,
        },
      });

      if (count === 0) {
        return false;
      }

      // Restore clears the deletion fields, so the audit entry keeps them.
      await recordAudit(tx, {
        actorId,
        action: 'CASE_RESTORED',
        entityType: 'INVESTIGATION_CASE',
        entityId: id,
        ...(await caseAuditScope(tx, id)),
        changes: {
          deletedReason: deleted?.deletionReason ?? null,
          memoReference: deleted?.deletionMemoReference ?? null,
        },
      });

      return true;
    });
  }

  private async lockCase(tx: Prisma.TransactionClient, id: string) {
    await tx.$queryRaw`SELECT id FROM "InvestigationCase" WHERE id = ${id} FOR UPDATE`;
  }

  // Locks the case, then confirms it is still at `officeId`, isn't deleted,
  // and has no open investigation.
  private async isUnchangedAndClosed(
    tx: Prisma.TransactionClient,
    caseId: string,
    officeId: string,
  ) {
    await this.lockCase(tx, caseId);

    const found = await tx.investigationCase.findUnique({
      where: { id: caseId },
      select: {
        deletedAt: true,
        handlingOfficeId: true,
        _count: { select: { investigations: { where: open } } },
      },
    });

    return (
      !!found &&
      found.deletedAt === null &&
      found.handlingOfficeId === officeId &&
      found._count.investigations === 0
    );
  }
}
