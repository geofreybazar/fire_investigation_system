-- CreateEnum
CREATE TYPE "IncidentApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "FireIncidentEventType" AS ENUM ('SUBMITTED', 'RESUBMITTED', 'APPROVED', 'REJECTED', 'REMOVED', 'DELETED', 'RESTORED');

-- CreateEnum
CREATE TYPE "ReferralDirection" AS ENUM ('UP', 'DOWN');

-- CreateEnum
CREATE TYPE "ReportDecision" AS ENUM ('UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "FireIncidentStatus" ADD VALUE 'REKINDLE';

-- AlterEnum
ALTER TYPE "ROLE" ADD VALUE 'CITY_MUNICIPALITY_CHIEF_INVESTIGATOR';

-- DropIndex
DROP INDEX "Investigation_fireIncidentId_key";

-- AlterTable
ALTER TABLE "FireIncident" ADD COLUMN     "approvalStatus" "IncidentApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "deletedById" TEXT,
ADD COLUMN     "deletionReason" TEXT,
ADD COLUMN     "investigationHandlingOfficeId" TEXT,
ADD COLUMN     "officeId" TEXT NOT NULL,
ALTER COLUMN "incidentNo" DROP NOT NULL;

-- AlterTable
ALTER TABLE "IncidentLocation" ADD COLUMN     "barangay" TEXT NOT NULL,
ADD COLUMN     "latitude" DECIMAL(9,6),
ADD COLUMN     "longitude" DECIMAL(9,6),
ALTER COLUMN "province_district" SET NOT NULL,
ALTER COLUMN "city_municipality" SET NOT NULL;

-- AlterTable
ALTER TABLE "IncidentTimeline" ADD COLUMN     "correctsEntryId" TEXT,
ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3),
ADD COLUMN     "voidedById" TEXT;

-- AlterTable
ALTER TABLE "Investigation" ADD COLUMN     "assignedById" TEXT NOT NULL,
ADD COLUMN     "assignedInvestigatorId" TEXT NOT NULL,
ADD COLUMN     "conductingOfficeId" TEXT NOT NULL,
ALTER COLUMN "startedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "InvestigationReport" ADD COLUMN     "reviewedById" TEXT;

-- CreateTable
CREATE TABLE "InvestigationReportReview" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "decision" "ReportDecision" NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestigationReportReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestigationReferral" (
    "id" TEXT NOT NULL,
    "fireIncidentId" TEXT NOT NULL,
    "fromOfficeId" TEXT NOT NULL,
    "toOfficeId" TEXT NOT NULL,
    "direction" "ReferralDirection" NOT NULL,
    "referredById" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestigationReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FireIncidentEvent" (
    "id" TEXT NOT NULL,
    "fireIncidentId" TEXT NOT NULL,
    "type" "FireIncidentEventType" NOT NULL,
    "actorId" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FireIncidentEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InvestigationReportReview_reportId_createdAt_idx" ON "InvestigationReportReview"("reportId", "createdAt");

-- CreateIndex
CREATE INDEX "InvestigationReferral_fireIncidentId_createdAt_idx" ON "InvestigationReferral"("fireIncidentId", "createdAt");

-- CreateIndex
CREATE INDEX "FireIncidentEvent_fireIncidentId_createdAt_idx" ON "FireIncidentEvent"("fireIncidentId", "createdAt");

-- CreateIndex
CREATE INDEX "FireIncident_officeId_idx" ON "FireIncident"("officeId");

-- CreateIndex
CREATE INDEX "FireIncident_investigationHandlingOfficeId_idx" ON "FireIncident"("investigationHandlingOfficeId");

-- CreateIndex
CREATE INDEX "FireIncident_approvalStatus_idx" ON "FireIncident"("approvalStatus");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentTimeline_correctsEntryId_key" ON "IncidentTimeline"("correctsEntryId");

-- CreateIndex
CREATE INDEX "Investigation_fireIncidentId_idx" ON "Investigation"("fireIncidentId");

-- CreateIndex
CREATE INDEX "Investigation_conductingOfficeId_idx" ON "Investigation"("conductingOfficeId");

-- CreateIndex
CREATE INDEX "Investigation_assignedInvestigatorId_idx" ON "Investigation"("assignedInvestigatorId");

-- AddForeignKey
ALTER TABLE "InvestigationReport" ADD CONSTRAINT "InvestigationReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationReportReview" ADD CONSTRAINT "InvestigationReportReview_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "InvestigationReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationReportReview" ADD CONSTRAINT "InvestigationReportReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_conductingOfficeId_fkey" FOREIGN KEY ("conductingOfficeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_assignedInvestigatorId_fkey" FOREIGN KEY ("assignedInvestigatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationReferral" ADD CONSTRAINT "InvestigationReferral_fireIncidentId_fkey" FOREIGN KEY ("fireIncidentId") REFERENCES "FireIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationReferral" ADD CONSTRAINT "InvestigationReferral_fromOfficeId_fkey" FOREIGN KEY ("fromOfficeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationReferral" ADD CONSTRAINT "InvestigationReferral_toOfficeId_fkey" FOREIGN KEY ("toOfficeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestigationReferral" ADD CONSTRAINT "InvestigationReferral_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTimeline" ADD CONSTRAINT "IncidentTimeline_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTimeline" ADD CONSTRAINT "IncidentTimeline_voidedById_fkey" FOREIGN KEY ("voidedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTimeline" ADD CONSTRAINT "IncidentTimeline_correctsEntryId_fkey" FOREIGN KEY ("correctsEntryId") REFERENCES "IncidentTimeline"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireIncident" ADD CONSTRAINT "FireIncident_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireIncident" ADD CONSTRAINT "FireIncident_investigationHandlingOfficeId_fkey" FOREIGN KEY ("investigationHandlingOfficeId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireIncident" ADD CONSTRAINT "FireIncident_deletedById_fkey" FOREIGN KEY ("deletedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireIncidentEvent" ADD CONSTRAINT "FireIncidentEvent_fireIncidentId_fkey" FOREIGN KEY ("fireIncidentId") REFERENCES "FireIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireIncidentEvent" ADD CONSTRAINT "FireIncidentEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
