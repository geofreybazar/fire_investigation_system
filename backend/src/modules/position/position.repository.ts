import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { PositionInput } from './schema/position.schema.js';
import { UUID } from 'crypto';
import {
  auditChanges,
  auditSnapshot,
  recordAudit,
} from '../audit/audit.writer.js';

import { LOGIN_INTERNAL_FIELDS } from '../users/users.repository.js';

@Injectable()
export class PositionRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createPosition(positionData: PositionInput, actorId: string) {
    return this.prismaService.$transaction(async (tx) => {
      const position = await tx.position.create({
        data: {
          name: positionData.name,
        },
      });

      await recordAudit(tx, {
        actorId,
        action: 'POSITION_CREATED',
        entityType: 'POSITION',
        entityId: position.id,
        changes: auditSnapshot(position, ['name']),
      });

      return position;
    });
  }

  async findPaginatedPositions(skip: number, limit: number, search?: string) {
    const where = {
      ...(search && {
        name: {
          contains: search,
          mode: 'insensitive' as const,
        },
      }),

      isActive: true,
    };

    const [positions, total] = await Promise.all([
      this.prismaService.position.findMany({
        where,
        include: {
          users: {
            omit: LOGIN_INTERNAL_FIELDS,
          },
        },
        skip,
        take: limit,
        orderBy: {
          name: 'asc',
        },
      }),

      this.prismaService.position.count({
        where,
      }),
    ]);

    return {
      positions,
      total,
    };
  }

  // Returns null when the position doesn't exist.
  async updatePosition(id: UUID, positionData: PositionInput, actorId: string) {
    return this.prismaService.$transaction(async (tx) => {
      const before = await tx.position.findUnique({ where: { id } });

      if (!before) {
        return null;
      }

      const position = await tx.position.update({
        data: {
          name: positionData.name,
        },
        where: {
          id,
        },
      });

      const changes = auditChanges(before, position, ['name']);

      if (Object.keys(changes).length > 0) {
        await recordAudit(tx, {
          actorId,
          action: 'POSITION_UPDATED',
          entityType: 'POSITION',
          entityId: id,
          changes,
        });
      }

      return position;
    });
  }

  async findPositionForDeletion(id: UUID) {
    return this.prismaService.position.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
    });
  }

  async deletePosition(id: UUID, actorId: string) {
    return this.prismaService.$transaction(async (tx) => {
      const position = await tx.position.delete({ where: { id } });

      await recordAudit(tx, {
        actorId,
        action: 'POSITION_DELETED',
        entityType: 'POSITION',
        entityId: id,
        changes: auditSnapshot(position, ['name']),
      });

      return position;
    });
  }

  async findAllPositions() {
    return this.prismaService.position.findMany({
      where: {
        isActive: true,
      },
      select: {
        id: true,
        name: true,
      },
    });
  }
}
