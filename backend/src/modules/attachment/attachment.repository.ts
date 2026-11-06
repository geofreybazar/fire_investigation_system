import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { Prisma } from '../../generated/prisma/client.js';
import { recordAudit } from '../audit/audit.writer.js';

// The case fields that decide who may see and change it (case-scope.ts).
const caseAccess = {
  select: {
    id: true,
    caseNo: true,
    createdById: true,
    handlingOfficeId: true,
    deletedAt: true,
    station: { select: { id: true, parentId: true, regionId: true } },
  },
} as const;

// What clients see; the storage key never leaves the server.
export const attachmentSummary = {
  id: true,
  caseId: true,
  investigationId: true,
  originalName: true,
  mimeType: true,
  sizeBytes: true,
  sha256: true,
  description: true,
  createdAt: true,
  uploadedBy: {
    select: { id: true, rank: true, first_name: true, last_name: true },
  },
} satisfies Prisma.AttachmentSelect;

@Injectable()
export class AttachmentRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async findOfficeType(officeId: string) {
    return this.prismaService.office.findUnique({
      where: { id: officeId },
      select: { id: true, type: true },
    });
  }

  async findCase(id: string) {
    return this.prismaService.investigationCase.findUnique({
      where: { id },
      ...caseAccess,
    });
  }

  async findInvestigation(id: string) {
    return this.prismaService.investigation.findUnique({
      where: { id },
      select: {
        id: true,
        investigationNo: true,
        caseId: true,
        assignedInvestigatorId: true,
        completedAt: true,
        case: caseAccess,
      },
    });
  }

  async create(data: Prisma.AttachmentUncheckedCreateInput) {
    return this.prismaService.attachment.create({
      data,
      select: attachmentSummary,
    });
  }

  // Includes the storage key, for downloads; never returned to clients.
  async findById(id: string) {
    return this.prismaService.attachment.findUnique({
      where: { id },
      select: {
        ...attachmentSummary,
        storageKey: true,
        removedAt: true,
        case: caseAccess,
        investigation: { select: { completedAt: true } },
      },
    });
  }

  async listForCase(caseId: string) {
    return this.prismaService.attachment.findMany({
      where: { caseId, investigationId: null, removedAt: null },
      select: attachmentSummary,
      orderBy: { createdAt: 'desc' },
    });
  }

  async listForInvestigation(investigationId: string) {
    return this.prismaService.attachment.findMany({
      where: { investigationId, removedAt: null },
      select: attachmentSummary,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPaginated(
    where: Prisma.AttachmentWhereInput,
    skip: number,
    take: number,
  ) {
    const [attachments, total] = await Promise.all([
      this.prismaService.attachment.findMany({
        where,
        select: {
          ...attachmentSummary,
          case: { select: { id: true, caseNo: true } },
          investigation: { select: { id: true, investigationNo: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prismaService.attachment.count({ where }),
    ]);

    return { attachments, total };
  }

  // Returns false if it was already removed.
  async softRemove(id: string, userId: string) {
    const { count } = await this.prismaService.attachment.updateMany({
      where: { id, removedAt: null },
      data: { removedAt: new Date(), removedById: userId },
    });

    return count > 0;
  }

  async recordDownload(
    attachment: { id: string; caseId: string; originalName: string },
    office: { officeId: string; regionId: string | null },
    actorId: string,
  ) {
    await recordAudit(this.prismaService, {
      actorId,
      action: 'ATTACHMENT_DOWNLOADED',
      entityType: 'ATTACHMENT',
      entityId: attachment.id,
      officeId: office.officeId,
      regionId: office.regionId,
      changes: {
        fileName: attachment.originalName,
        caseId: attachment.caseId,
      },
    });
  }
}
