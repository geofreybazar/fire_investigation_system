import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { AuditEntityType, ROLE } from '../../generated/prisma/enums.js';
import { CurrentUserJwtPayload } from '../../types/jwt.payload.js';
import { AuditRepository } from './audit.repository.js';
import { type ListAuditLogsQuery } from './schema/audit.schema.js';

const PAGE_SIZE = 20;

// "Admin changes": everything except SUPER_ADMIN case deletion/restore.
const ADMIN_ENTITY_TYPES: AuditEntityType[] = [
  AuditEntityType.USER,
  AuditEntityType.OFFICE,
  AuditEntityType.POSITION,
  AuditEntityType.FIRE_INCIDENT_CATEGORY,
  AuditEntityType.FIRE_INCIDENT_SUBCATEGORY,
];

// Region-scoped entities; positions and categories are national lists.
const REGIONAL_ENTITY_TYPES: AuditEntityType[] = [
  AuditEntityType.USER,
  AuditEntityType.OFFICE,
];

@Injectable()
export class AuditService {
  constructor(private readonly auditRepository: AuditRepository) {}

  async findPaginated(query: ListAuditLogsQuery, user: CurrentUserJwtPayload) {
    const where: Prisma.AuditLogWhereInput = {
      AND: [
        this.scopeWhere(user),
        {
          ...(query.action && { action: query.action }),
          ...(query.entityType && { entityType: query.entityType }),
          ...(query.entityId && { entityId: query.entityId }),
          ...(query.actorId && { actorId: query.actorId }),
          ...((query.from || query.to) && {
            createdAt: {
              ...(query.from && { gte: query.from }),
              ...(query.to && { lte: query.to }),
            },
          }),
        },
      ],
    };

    const skip = (query.page - 1) * PAGE_SIZE;
    const { auditLogs, total } = await this.auditRepository.findPaginated(
      where,
      skip,
      PAGE_SIZE,
    );

    return {
      data: auditLogs,
      pagination: {
        page: query.page,
        limit: PAGE_SIZE,
        total,
        totalPages: Math.ceil(total / PAGE_SIZE),
      },
    };
  }

  // SUPER_ADMIN reads everything, NHQ_ADMIN reads admin changes, and
  // REGIONAL_ADMIN reads user and office changes in its region plus its own
  // actions (Q-23).
  private scopeWhere(user: CurrentUserJwtPayload): Prisma.AuditLogWhereInput {
    switch (user.role) {
      case ROLE.SUPER_ADMIN:
        return {};
      case ROLE.NHQ_ADMIN:
        return { entityType: { in: ADMIN_ENTITY_TYPES } };
      case ROLE.REGIONAL_ADMIN:
        return {
          OR: [
            {
              entityType: { in: REGIONAL_ENTITY_TYPES },
              OR: [{ officeId: user.officeId }, { regionId: user.officeId }],
            },
            {
              actorId: user.sub,
              entityType: { in: ADMIN_ENTITY_TYPES },
            },
          ],
        };
      default:
        throw new ForbiddenException(
          'You are not allowed to view the audit log.',
        );
    }
  }
}
