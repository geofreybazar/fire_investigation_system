-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INCIDENT_SUBMITTED', 'INCIDENT_RESUBMITTED', 'INCIDENT_APPROVED', 'INCIDENT_REJECTED', 'INCIDENT_INVESTIGABLE', 'CASE_REFERRED', 'INVESTIGATOR_ASSIGNED', 'REPORT_SUBMITTED', 'REPORT_APPROVED', 'REPORT_REJECTED');

-- CreateEnum
CREATE TYPE "NotificationEntityType" AS ENUM ('FIRE_INCIDENT', 'INVESTIGATION');

-- AlterTable
ALTER TABLE "NotificationPreference" ADD COLUMN     "incidentUpdates" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "entityType" "NotificationEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

