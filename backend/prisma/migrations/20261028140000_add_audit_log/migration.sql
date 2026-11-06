-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'USER_PASSWORD_CHANGED', 'OFFICE_CREATED', 'OFFICE_UPDATED', 'OFFICE_DELETED', 'POSITION_CREATED', 'POSITION_UPDATED', 'POSITION_DELETED', 'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED', 'SUBCATEGORY_CREATED', 'SUBCATEGORY_UPDATED', 'SUBCATEGORY_DELETED', 'INCIDENT_DELETED', 'INCIDENT_RESTORED');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('USER', 'OFFICE', 'POSITION', 'FIRE_INCIDENT_CATEGORY', 'FIRE_INCIDENT_SUBCATEGORY', 'FIRE_INCIDENT');

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "officeId" TEXT,
    "regionId" TEXT,
    "changes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_officeId_idx" ON "AuditLog"("officeId");

-- CreateIndex
CREATE INDEX "AuditLog_regionId_idx" ON "AuditLog"("regionId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

