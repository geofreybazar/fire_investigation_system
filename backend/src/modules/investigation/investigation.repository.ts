import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import {
  CauseOfFire,
  FireCaseClassification,
  ReportDecision,
  ReportStatus,
} from '../../generated/prisma/enums.js';
import {
  awaitsDecision,
  REPORT_EDITABLE_STATUSES,
  REVIEW_FROM,
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

// Why a case is in the chief investigator's queue.
export type QueueReason = 'DECISION' | 'REVIEW';

export interface InvestigationDraft {
  investigation: {
    causeOfFire?: CauseOfFire | null;
    classification?: FireCaseClassification | null;
    originOfFire?: string | null;
  };
  report?: {
    findings?: string | null;
    cause?: string | null;
    conclusion?: string | null;
    recommendations?: string | null;
  };
}

@Injectable()
export class InvestigationRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findOfficeType(officeId: string) {
    return this.prismaService.office.findUnique({
      where: { id: officeId },
      select: { id: true, type: true },
    });
  }

  // Investigation fields every access decision needs.
  async findForAccess(id: string) {
    return this.prismaService.investigation.findUnique({
      where: { id },
      select: {
        id: true,
        investigationNo: true,
        caseId: true,
        conductingOfficeId: true,
        assignedInvestigatorId: true,
        classification: true,
        causeOfFire: true,
        completedAt: true,
        report: { select: { status: true } },
        case: {
          select: {
            deletedAt: true,
            station: { select: { id: true, parentId: true, regionId: true } },
          },
        },
      },
    });
  }

  async findDetail(id: string) {
    return this.prismaService.investigation.findUnique({
      where: { id },
      include: {
        case: {
          select: {
            id: true,
            caseNo: true,
            station: officeSummary,
            location: true,
          },
        },
        conductingOffice: officeSummary,
        assignedInvestigator: userSummary,
        assignedBy: userSummary,
        report: {
          include: {
            reviewedBy: userSummary,
            reviews: {
              orderBy: { createdAt: 'asc' },
              include: { reviewer: userSummary },
            },
          },
        },
      },
    });
  }

  // Saves the investigator's draft. Returns false if the investigation is
  // completed or its report is no longer editable.
  async updateDraft(id: string, draft: InvestigationDraft) {
    return this.prismaService.$transaction(async (tx) => {
      const current = await tx.investigation.findUnique({
        where: { id },
        select: { completedAt: true, report: { select: { status: true } } },
      });

      if (
        !current ||
        current.completedAt !== null ||
        (current.report &&
          !REPORT_EDITABLE_STATUSES.includes(current.report.status))
      ) {
        return false;
      }

      await tx.investigation.update({
        where: { id },
        data: {
          ...draft.investigation,
          ...(draft.report && {
            report: {
              upsert: {
                create: { ...draft.report, status: ReportStatus.DRAFT },
                update: draft.report,
              },
            },
          }),
        },
      });

      return true;
    });
  }

  async submitReport(id: string) {
    const { count } = await this.prismaService.investigationReport.updateMany({
      where: {
        investigationId: id,
        status: { in: REPORT_EDITABLE_STATUSES },
        investigation: open,
      },
      data: { status: ReportStatus.SUBMITTED, submittedAt: new Date() },
    });

    return count > 0;
  }

  // Records a review decision. Approval also completes the investigation.
  // Returns false if the report is not in a state the decision applies to.
  async review(
    id: string,
    decision: ReportDecision,
    reviewerId: string,
    remarks?: string | null,
  ) {
    return this.prismaService.$transaction(async (tx) => {
      const report = await tx.investigationReport.findFirst({
        where: {
          investigationId: id,
          status: { in: REVIEW_FROM[decision] },
          investigation: open,
        },
        select: { id: true },
      });

      if (!report) {
        return false;
      }

      const now = new Date();

      await tx.investigationReport.update({
        where: { id: report.id },
        data: {
          // ReportDecision values are the matching ReportStatus values.
          status: decision as ReportStatus,
          reviewedAt: now,
          reviewedById: reviewerId,
        },
      });
      await tx.investigationReportReview.create({
        data: { reportId: report.id, decision, reviewerId, remarks },
      });

      if (decision === ReportDecision.APPROVED) {
        await tx.investigation.update({
          where: { id },
          data: { completedAt: now },
        });
      }

      return true;
    });
  }

  // Cases waiting on the office's chief investigator: a case to decide
  // (start, refer or leave) or a submitted report to review.
  async findQueue(officeId: string, skip: number, take: number) {
    const awaitingReview: Prisma.InvestigationWhereInput = {
      ...open,
      conductingOfficeId: officeId,
      report: { status: { in: REVIEW_FROM[ReportDecision.APPROVED] } },
    };

    // Which cases still wait depends on referral and start dates, so the
    // candidates are filtered here and only the page is loaded in full.
    const candidates = await this.prismaService.investigationCase.findMany({
      where: {
        deletedAt: null,
        handlingOfficeId: officeId,
        OR: [
          { investigations: { none: open } },
          { investigations: { some: awaitingReview } },
        ],
      },
      select: {
        id: true,
        investigations: {
          where: { conductingOfficeId: officeId },
          orderBy: { startedAt: 'desc' },
          take: 1,
          select: { startedAt: true, completedAt: true },
        },
        referrals: {
          where: { toOfficeId: officeId },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { createdAt: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const waiting = new Map<string, QueueReason>();
    for (const candidate of candidates) {
      const [lastHere] = candidate.investigations;
      if (lastHere && lastHere.completedAt === null) {
        waiting.set(candidate.id, 'REVIEW');
      } else if (
        awaitsDecision(
          lastHere?.startedAt ?? null,
          candidate.referrals[0]?.createdAt ?? null,
        )
      ) {
        waiting.set(candidate.id, 'DECISION');
      }
    }

    const pageIds = [...waiting.keys()].slice(skip, skip + take);
    const rows = await this.prismaService.investigationCase.findMany({
      where: { id: { in: pageIds } },
      select: {
        id: true,
        caseNo: true,
        createdAt: true,
        station: officeSummary,
        location: {
          select: {
            placeOfOccurence: true,
            barangay: true,
            city_municipality: true,
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
      },
    });

    const byId = new Map(rows.map((row) => [row.id, row]));
    const cases = pageIds.flatMap((id) => {
      const row = byId.get(id);
      return row ? [{ ...row, awaiting: waiting.get(id)! }] : [];
    });

    return { cases, total: waiting.size };
  }

  async findAssigned(userId: string, skip: number, take: number) {
    const where: Prisma.InvestigationWhereInput = {
      assignedInvestigatorId: userId,
      case: { deletedAt: null },
    };

    const [investigations, total] = await Promise.all([
      this.prismaService.investigation.findMany({
        where,
        select: {
          id: true,
          investigationNo: true,
          startedAt: true,
          completedAt: true,
          conductingOffice: officeSummary,
          case: { select: { id: true, caseNo: true } },
          report: { select: { status: true } },
        },
        orderBy: { startedAt: 'desc' },
        skip,
        take,
      }),
      this.prismaService.investigation.count({ where }),
    ]);

    return { investigations, total };
  }
}
