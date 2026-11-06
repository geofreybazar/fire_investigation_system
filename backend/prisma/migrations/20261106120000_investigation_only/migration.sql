-- Investigation-only redesign (REQUIREMENTS.md rev 13): fire incidents are
-- removed and investigations hang off the new InvestigationCase. Existing
-- incident data is discarded (approved: development data only).

-- Discard data that depends on fire incidents.
DELETE FROM "Attachment";
DELETE FROM "InvestigationReportReview";
DELETE FROM "InvestigationReport";
DELETE FROM "Investigation";
DELETE FROM "InvestigationReferral";
DELETE FROM "Notification" WHERE "entityType" = 'FIRE_INCIDENT'
  OR "type" IN ('INCIDENT_SUBMITTED', 'INCIDENT_RESUBMITTED', 'INCIDENT_APPROVED', 'INCIDENT_REJECTED', 'INCIDENT_INVESTIGABLE');
DELETE FROM "AuditLog" WHERE "action" IN ('INCIDENT_DELETED', 'INCIDENT_RESTORED') OR "entityType" = 'FIRE_INCIDENT';
DELETE FROM "IncidentTimeline";
DELETE FROM "FireIncidentEvent";
DELETE FROM "FireIncident";

-- Remove users holding the retired operations roles. This fails (and the
-- migration rolls back) if such a user is the actor of an audit entry.
DELETE FROM "User" WHERE "role"::text IN (
  'NHQ_OPERATION', 'NHQ_OPERATION_STAFF',
  'REGIONAL_OPERATION', 'REGIONAL_OPERATION_STAFF',
  'DISTRICT_PROVINCE_OPERATION', 'DISTRICT_PROVINCE_OPERATION_STAFF',
  'CITY_MUNICIPALITY_OPERATION', 'CITY_MUNICIPALITY_OPERATION_STAFF',
  'CITY_MUNICIPALITY_COMMEL'
);

-- AlterEnum
BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('USER_CREATED', 'USER_UPDATED', 'USER_ACTIVATED', 'USER_DEACTIVATED', 'USER_PASSWORD_CHANGED', 'OFFICE_CREATED', 'OFFICE_UPDATED', 'OFFICE_DELETED', 'POSITION_CREATED', 'POSITION_UPDATED', 'POSITION_DELETED', 'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED', 'SUBCATEGORY_CREATED', 'SUBCATEGORY_UPDATED', 'SUBCATEGORY_DELETED', 'CASE_DELETED', 'CASE_RESTORED', 'ATTACHMENT_DOWNLOADED');
ALTER TABLE "AuditLog" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "public"."AuditAction_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "AuditEntityType_new" AS ENUM ('USER', 'OFFICE', 'POSITION', 'FIRE_INCIDENT_CATEGORY', 'FIRE_INCIDENT_SUBCATEGORY', 'INVESTIGATION_CASE', 'ATTACHMENT');
ALTER TABLE "AuditLog" ALTER COLUMN "entityType" TYPE "AuditEntityType_new" USING ("entityType"::text::"AuditEntityType_new");
ALTER TYPE "AuditEntityType" RENAME TO "AuditEntityType_old";
ALTER TYPE "AuditEntityType_new" RENAME TO "AuditEntityType";
DROP TYPE "public"."AuditEntityType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationEntityType_new" AS ENUM ('INVESTIGATION_CASE', 'INVESTIGATION');
ALTER TABLE "Notification" ALTER COLUMN "entityType" TYPE "NotificationEntityType_new" USING ("entityType"::text::"NotificationEntityType_new");
ALTER TYPE "NotificationEntityType" RENAME TO "NotificationEntityType_old";
ALTER TYPE "NotificationEntityType_new" RENAME TO "NotificationEntityType";
DROP TYPE "public"."NotificationEntityType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('CASE_REFERRED', 'INVESTIGATOR_ASSIGNED', 'REPORT_SUBMITTED', 'REPORT_APPROVED', 'REPORT_REJECTED');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ROLE_new" AS ENUM ('SUPER_ADMIN', 'NHQ_ADMIN', 'NHQ_VIEWER', 'NHQ_CHIEF_INVESTIGATOR', 'NHQ_INVESTIGATOR', 'REGIONAL_ADMIN', 'REGIONAL_CHIEF_INVESTIGATOR', 'REGIONAL_INVESTIGATOR', 'REGIONAL_VIEWER', 'DISTRICT_PROVINCE_CHIEF_INVESTIGATOR', 'DISTRICT_PROVINCE_INVESTIGATOR', 'DISTRICT_PROVINCE_VIEWER', 'CITY_MUNICIPALITY_INVESTIGATOR', 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "ROLE_new" USING ("role"::text::"ROLE_new");
ALTER TYPE "ROLE" RENAME TO "ROLE_old";
ALTER TYPE "ROLE_new" RENAME TO "ROLE";
DROP TYPE "public"."ROLE_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_fireIncidentId_fkey";

-- DropForeignKey
ALTER TABLE "FireIncident" DROP CONSTRAINT "FireIncident_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "FireIncident" DROP CONSTRAINT "FireIncident_createdById_fkey";

-- DropForeignKey
ALTER TABLE "FireIncident" DROP CONSTRAINT "FireIncident_deletedById_fkey";

-- DropForeignKey
ALTER TABLE "FireIncident" DROP CONSTRAINT "FireIncident_establishmentId_fkey";

-- DropForeignKey
ALTER TABLE "FireIncident" DROP CONSTRAINT "FireIncident_investigationHandlingOfficeId_fkey";

-- DropForeignKey
ALTER TABLE "FireIncident" DROP CONSTRAINT "FireIncident_officeId_fkey";

-- DropForeignKey
ALTER TABLE "FireIncident" DROP CONSTRAINT "FireIncident_subcategoryId_fkey";

-- DropForeignKey
ALTER TABLE "FireIncidentEvent" DROP CONSTRAINT "FireIncidentEvent_actorId_fkey";

-- DropForeignKey
ALTER TABLE "FireIncidentEvent" DROP CONSTRAINT "FireIncidentEvent_fireIncidentId_fkey";

-- DropForeignKey
ALTER TABLE "FireOpertaionResources" DROP CONSTRAINT "FireOpertaionResources_fireIncidentId_fkey";

-- DropForeignKey
ALTER TABLE "IncidentImpact" DROP CONSTRAINT "IncidentImpact_fireIncidentId_fkey";

-- DropForeignKey
ALTER TABLE "IncidentLocation" DROP CONSTRAINT "IncidentLocation_fireIncidentId_fkey";

-- DropForeignKey
ALTER TABLE "IncidentPersonnel" DROP CONSTRAINT "IncidentPersonnel_fireIncidentId_fkey";

-- DropForeignKey
ALTER TABLE "IncidentTimeline" DROP CONSTRAINT "IncidentTimeline_correctsEntryId_fkey";

-- DropForeignKey
ALTER TABLE "IncidentTimeline" DROP CONSTRAINT "IncidentTimeline_createdById_fkey";

-- DropForeignKey
ALTER TABLE "IncidentTimeline" DROP CONSTRAINT "IncidentTimeline_fireIncidentId_fkey";

-- DropForeignKey
ALTER TABLE "IncidentTimeline" DROP CONSTRAINT "IncidentTimeline_voidedById_fkey";

-- DropForeignKey
ALTER TABLE "Investigation" DROP CONSTRAINT "Investigation_fireIncidentId_fkey";

-- DropForeignKey
ALTER TABLE "InvestigationReferral" DROP CONSTRAINT "InvestigationReferral_fireIncidentId_fkey";

-- DropIndex
DROP INDEX "Attachment_fireIncidentId_createdAt_idx";

-- DropIndex
DROP INDEX "Investigation_fireIncidentId_idx";

-- DropIndex
DROP INDEX "InvestigationReferral_fireIncidentId_createdAt_idx";

-- AlterTable
ALTER TABLE "Attachment" DROP COLUMN "fireIncidentId",
ADD COLUMN     "caseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Investigation" DROP COLUMN "fireIncidentId",
ADD COLUMN     "caseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InvestigationReferral" DROP COLUMN "fireIncidentId",
ADD COLUMN     "caseId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "NotificationPreference" DROP COLUMN "incidentUpdates";

-- DropTable
DROP TABLE "FireIncident";

-- DropTable
DROP TABLE "FireIncidentEvent";

-- DropTable
DROP TABLE "FireOpertaionResources";

-- DropTable
DROP TABLE "IncidentImpact";

-- DropTable
DROP TABLE "IncidentLocation";

-- DropTable
DROP TABLE "IncidentPersonnel";

-- DropTable
DROP TABLE "IncidentTimeline";

-- DropEnum
DROP TYPE "FireAlarmLevel";

-- DropEnum
DROP TYPE "FireIncidentEventType";

-- DropEnum
DROP TYPE "FireIncidentStatus";

-- DropEnum
DROP TYPE "IncidentApprovalStatus";

-- CreateTable
CREATE TABLE "InvestigationCase" (
    "id" TEXT NOT NULL,
    "caseNo" TEXT NOT NULL,
    "dateTimeFireIncident" TIMESTAMP(3),
    "dateTimeReported" TIMESTAMP(3),
    "dateTimeCallReceived" TIMESTAMP(3),
    "stationId" TEXT NOT NULL,
    "createdByOfficeId" TEXT NOT NULL,
    "handlingOfficeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "establishmentId" TEXT,
    "remarks" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedById" TEXT,
    "deletionReason" TEXT,
    "deletionMemoReference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestigationCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseLocation" (
    "id" TEXT NOT NULL,
    "placeOfOccurence" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "province_district" TEXT NOT NULL,
    "city_municipality" TEXT NOT NULL,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "caseId" TEXT NOT NULL,

    CONSTRAINT "CaseLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaseImpact" (
    "id" TEXT NOT NULL,
    "fatalitiesCiv" INTEGER NOT NULL DEFAULT 0,
    "injuredCiv" INTEGER NOT NULL DEFAULT 0,
    "fatalitiesBFP" INTEGER NOT NULL DEFAULT 0,
    "injuredBFP" INTEGER NOT NULL DEFAULT 0,
    "fatalitiesLEA" INTEGER NOT NULL DEFAULT 0,
    "injuredLEA" INTEGER NOT NULL DEFAULT 0,
    "establishmentsBurned" INTEGER NOT NULL DEFAULT 0,
    "familiesAffected" INTEGER NOT NULL DEFAULT 0,
    "individualsAffected" INTEGER NOT NULL DEFAULT 0,
    "estimatedDamages" DECIMAL(15,2),
    "finalEstimatedDamages" DECIMAL(15,2),
    "caseId" TEXT NOT NULL,

    CONSTRAINT "CaseImpact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestigationCase_caseNo_key" ON "InvestigationCase"("caseNo");

-- CreateIndex
CREATE INDEX "InvestigationCase_stationId_idx" ON "InvestigationCase"("stationId");

-- CreateIndex
CREATE INDEX "InvestigationCase_createdByOfficeId_idx" ON "InvestigationCase"("createdByOfficeId");

-- CreateIndex
CREATE INDEX "InvestigationCase_handlingOfficeId_idx" ON "InvestigationCase"("handlingOfficeId");

-- CreateIndex
CREATE INDEX "InvestigationCase_categoryId_idx" ON "InvestigationCase"("categoryId");

-- CreateIndex
CREATE INDEX "InvestigationCase_subcategoryId_idx" ON "InvestigationCase"("subcategoryId");

-- CreateIndex
CREATE INDEX "InvestigationCase_establishmentId_idx" ON "InvestigationCase"("establishmentId");

-- CreateIndex
CREATE INDEX "InvestigationCase_dateTimeFireIncident_idx" ON "InvestigationCase"("dateTimeFireIncident");

-- CreateIndex
CREATE INDEX "InvestigationCase_deletedAt_idx" ON "InvestigationCase"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CaseLocation_caseId_key" ON "CaseLocation"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "CaseImpact_caseId_key" ON "CaseImpact"("caseId");

-- CreateIndex
CREATE INDEX "Attachment_caseId_createdAt_idx" ON "Attachment"("caseId", "createdAt");

-- CreateIndex
CREATE INDEX "Investigation_caseId_idx" ON "Investigation"("caseId");

-- CreateIndex
CREATE INDEX "InvestigationReferral_caseId_createdAt_idx" ON "InvestigationReferral"("caseId", "createdAt");

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "InvestigationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationCase" ADD CONSTRAINT "InvestigationCase_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationCase" ADD CONSTRAINT "InvestigationCase_createdByOfficeId_fkey" FOREIGN KEY ("createdByOfficeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationCase" ADD CONSTRAINT "InvestigationCase_handlingOfficeId_fkey" FOREIGN KEY ("handlingOfficeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationCase" ADD CONSTRAINT "InvestigationCase_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationCase" ADD CONSTRAINT "InvestigationCase_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FireIncidentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationCase" ADD CONSTRAINT "InvestigationCase_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "FireIncidentSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationCase" ADD CONSTRAINT "InvestigationCase_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationCase" ADD CONSTRAINT "InvestigationCase_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseLocation" ADD CONSTRAINT "CaseLocation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "InvestigationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaseImpact" ADD CONSTRAINT "CaseImpact_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "InvestigationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationReferral" ADD CONSTRAINT "InvestigationReferral_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "InvestigationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "InvestigationCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

