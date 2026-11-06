-- AlterTable
ALTER TABLE "Office" ADD COLUMN     "regionCode" TEXT;

-- CreateIndex
CREATE INDEX "FireIncident_establishmentId_idx" ON "FireIncident"("establishmentId");
