import type { Pagination } from "../pagination";

// Mirrors the backend enums (backend/prisma/models/auditLog.prisma).
export const AUDIT_ENTITY_TYPES = [
  "USER",
  "OFFICE",
  "POSITION",
  "FIRE_INCIDENT_CATEGORY",
  "FIRE_INCIDENT_SUBCATEGORY",
  "INVESTIGATION_CASE",
] as const;
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

export const AUDIT_ACTIONS = [
  "USER_CREATED",
  "USER_UPDATED",
  "USER_ACTIVATED",
  "USER_DEACTIVATED",
  "USER_PASSWORD_CHANGED",
  "OFFICE_CREATED",
  "OFFICE_UPDATED",
  "OFFICE_DELETED",
  "POSITION_CREATED",
  "POSITION_UPDATED",
  "POSITION_DELETED",
  "CATEGORY_CREATED",
  "CATEGORY_UPDATED",
  "CATEGORY_DELETED",
  "SUBCATEGORY_CREATED",
  "SUBCATEGORY_UPDATED",
  "SUBCATEGORY_DELETED",
  "CASE_DELETED",
  "CASE_RESTORED",
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

type AuditValue = string | number | boolean | null;

export interface AuditLog {
  id: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  officeId: string | null;
  regionId: string | null;
  // { field: { from, to } } for updates, { field: value } for creates/deletes.
  changes: Record<string, AuditValue | { from: AuditValue; to: AuditValue }> | null;
  createdAt: string;
  actor: {
    id: string;
    first_name: string;
    last_name: string;
    account_number: string;
    role: string;
  };
}

export interface AuditLogFilters {
  page: number;
  action?: AuditAction;
  entityType?: AuditEntityType;
  // ISO timestamps bounding the entry time.
  from?: string;
  to?: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  pagination: Pagination;
}
