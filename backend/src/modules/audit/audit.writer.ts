import { Prisma } from '../../generated/prisma/client.js';
import { AuditAction, AuditEntityType } from '../../generated/prisma/enums.js';

// Feature repositories call recordAudit inside the transaction that makes the
// change, so a change is never saved without its audit entry (Q-23).

export interface AuditEntry {
  actorId: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  // The affected office and its region, for REGIONAL_ADMIN scoping.
  officeId?: string | null;
  regionId?: string | null;
  changes?: Record<string, unknown>;
}

export async function recordAudit(
  tx: Prisma.TransactionClient,
  entry: AuditEntry,
) {
  const { changes, ...rest } = entry;

  await tx.auditLog.create({
    data: {
      ...rest,
      ...(changes && { changes: changes as Prisma.InputJsonValue }),
    },
  });
}

type AuditValue = string | number | boolean | null;

// JSON-safe form of a column value (dates and decimals become strings).
function auditValue(value: unknown): AuditValue {
  if (value === undefined || value === null) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }

  return String(value);
}

// The listed fields of a record, for create and delete entries.
export function auditSnapshot<T extends object>(
  record: T,
  fields: (keyof T & string)[],
): Record<string, AuditValue> {
  return Object.fromEntries(
    fields.map((field) => [field, auditValue(record[field])]),
  );
}

// Only the listed fields whose value changed, as { field: { from, to } }.
// Callers list fields explicitly, so passwords and tokens are never included.
export function auditChanges<T extends object>(
  before: T,
  after: T,
  fields: (keyof T & string)[],
): Record<string, { from: AuditValue; to: AuditValue }> {
  const changes: Record<string, { from: AuditValue; to: AuditValue }> = {};

  for (const field of fields) {
    const from = auditValue(before[field]);
    const to = auditValue(after[field]);

    if (from !== to) {
      changes[field] = { from, to };
    }
  }

  return changes;
}
