import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import { FireIncidentCategoriesInput } from './schema/fire-incident-categories.schema.js';
import { Prisma } from '../../generated/prisma/client.js';
import {
  auditChanges,
  auditSnapshot,
  recordAudit,
} from '../audit/audit.writer.js';

@Injectable()
export class FireIncidentCategoriesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async addFireIncidentCategory(
    fireIncidentCategoryInput: FireIncidentCategoriesInput,
    actorId: string,
  ) {
    return this.prismaService.$transaction(async (tx) => {
      const category = await tx.fireIncidentCategory.create({
        data: fireIncidentCategoryInput,
      });

      await recordAudit(tx, {
        actorId,
        action: 'CATEGORY_CREATED',
        entityType: 'FIRE_INCIDENT_CATEGORY',
        entityId: category.id,
        changes: auditSnapshot(category, ['name', 'type']),
      });

      return category;
    });
  }

  async getPaginatedCategories(
    searchQuery: string,
    limit: number,
    skip: number,
  ) {
    const where: Prisma.FireIncidentCategoryWhereInput = {
      name: {
        contains: searchQuery,
        mode: 'insensitive',
      },
    };

    const [fireIncidentCategories, totalCount] = await Promise.all([
      this.prismaService.fireIncidentCategory.findMany({
        where,
        include: {
          subCategories: true,
          _count: { select: { cases: true } },
        },
        take: limit,
        skip: skip,
      }),
      this.prismaService.fireIncidentCategory.count({ where }),
    ]);

    return {
      fireIncidentCategories,
      totalCount,
    };
  }

  async editFireIncidentCategory(
    id: string,
    fireIncidentCategoryInput: FireIncidentCategoriesInput,
    actorId: string,
  ) {
    return this.prismaService.$transaction(async (tx) => {
      const before = await tx.fireIncidentCategory.findUnique({
        where: { id },
      });

      const category = await tx.fireIncidentCategory.update({
        where: { id },
        data: { ...fireIncidentCategoryInput },
      });

      const changes = before
        ? auditChanges(before, category, ['name', 'type'])
        : {};

      if (Object.keys(changes).length > 0) {
        await recordAudit(tx, {
          actorId,
          action: 'CATEGORY_UPDATED',
          entityType: 'FIRE_INCIDENT_CATEGORY',
          entityId: id,
          changes,
        });
      }

      return category;
    });
  }

  async getCategoryById(id: string) {
    return this.prismaService.fireIncidentCategory.findUnique({
      where: { id },
      include: {
        subCategories: true,
        _count: { select: { cases: true } },
      },
    });
  }

  async deleteById(id: string, actorId: string) {
    return this.prismaService.$transaction(async (tx) => {
      const category = await tx.fireIncidentCategory.delete({
        where: { id },
      });

      await recordAudit(tx, {
        actorId,
        action: 'CATEGORY_DELETED',
        entityType: 'FIRE_INCIDENT_CATEGORY',
        entityId: id,
        changes: auditSnapshot(category, ['name', 'type']),
      });

      return category;
    });
  }
}
