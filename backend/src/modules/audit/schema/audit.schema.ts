import { z } from 'zod';
import {
  AuditAction,
  AuditEntityType,
} from '../../../generated/prisma/enums.js';

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  action: z.enum(AuditAction).optional(),
  entityType: z.enum(AuditEntityType).optional(),
  entityId: z.string().trim().max(100).optional(),
  actorId: z.uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
