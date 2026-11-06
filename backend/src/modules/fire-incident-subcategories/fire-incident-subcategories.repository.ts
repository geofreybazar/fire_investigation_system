import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service.js';
import {
  type EditFireIncidentSubCategoryInput,
  FireIncidentSubCategoriesInput,
} from './schema/fire-incident-subcategories.schema.js';
import {
  auditChanges,
  auditSnapshot,
  recordAudit,
} from '../audit/audit.writer.js';

@Injectable()
export class FireIncidentSubCategoriesRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async addFireIncidentSubcategory(
    fireIncidentSubCategoryInput: FireIncidentSubCategoriesInput,
    actorId: string,
  ) {
    return this.prismaService.$transaction(async (tx) => {
      const subcategory = await tx.fireIncidentSubcategory.create({
        data: fireIncidentSubCategoryInput,
      });

      await recordAudit(tx, {
        actorId,
        action: 'SUBCATEGORY_CREATED',
        entityType: 'FIRE_INCIDENT_SUBCATEGORY',
        entityId: subcategory.id,
        changes: auditSnapshot(subcategory, ['name', 'categoryId']),
      });

      return subcategory;
    });
  }

  async getSubcategoryById(id: string) {
    return this.prismaService.fireIncidentSubcategory.findUnique({
      where: { id },
      include: {
        _count: { select: { cases: true } },
      },
    });
  }

  async editFireIncidentSubcategory(
    id: string,
    input: EditFireIncidentSubCategoryInput,
    actorId: string,
  ) {
    return this.prismaService.$transaction(async (tx) => {
      const before = await tx.fireIncidentSubcategory.findUnique({
        where: { id },
      });

      const subcategory = await tx.fireIncidentSubcategory.update({
        where: { id },
        data: { name: input.name },
      });

      const changes = before ? auditChanges(before, subcategory, ['name']) : {};

      if (Object.keys(changes).length > 0) {
        await recordAudit(tx, {
          actorId,
          action: 'SUBCATEGORY_UPDATED',
          entityType: 'FIRE_INCIDENT_SUBCATEGORY',
          entityId: id,
          changes,
        });
      }

      return subcategory;
    });
  }

  async deleteById(id: string, actorId: string) {
    return this.prismaService.$transaction(async (tx) => {
      const subcategory = await tx.fireIncidentSubcategory.delete({
        where: { id },
      });

      await recordAudit(tx, {
        actorId,
        action: 'SUBCATEGORY_DELETED',
        entityType: 'FIRE_INCIDENT_SUBCATEGORY',
        entityId: id,
        changes: auditSnapshot(subcategory, ['name', 'categoryId']),
      });

      return subcategory;
    });
  }
}
