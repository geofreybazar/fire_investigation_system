-- CreateEnum
CREATE TYPE "FireAlarmLevel" AS ENUM ('FIRST_ALARM', 'SECOND_ALARM', 'THIRD_ALARM', 'FOURTH_ALARM', 'FIFTH_ALARM', 'TASK_FORCE_ALPHA', 'TASK_FORCE_BRAVO', 'TASK_FORCE_CHARLIE', 'TASK_FORCE_DELTA', 'GENERAL_ALARM');

-- CreateEnum
CREATE TYPE "FireIncidentStatus" AS ENUM ('VERIFICATION', 'ON_GOING', 'FIRE_UNDER_CONTROL', 'FIRE_OUT', 'FIRE_OUT_UPON_ARRIVAL', 'FALSE_ALARM');

-- CreateEnum
CREATE TYPE "FireCaseClassification" AS ENUM ('UNDER_INVESTIGATION', 'ACCIDENTAL', 'INCENDIARY_INTENTIONAL', 'NATURAL', 'FIRE_CASE_WITH_NEGLIGENT_ACTS');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CATEGORY_TYPE" AS ENUM ('STRUCTURAL', 'NON_STRUCTURAL', 'TRANSPORTATION', 'WILDLAND');

-- CreateEnum
CREATE TYPE "CauseOfFire" AS ENUM ('UNDER_INVESTIGATION', 'OTHER_CAUSES_OF_FIRE_INCIDENT', 'ELECTRICAL_IGNITION_CAUSED_BY_ARCHING', 'OPEN_FLAME_FROM_COOKING', 'ELECTRICAL_IGNITION_CAUSED_BY_LOOSED_CONNECTION', 'OPEN_FLAME_FROM_RUBBISH_FIRE_BONFIRE_TO_STRUCTURAL_FIRE', 'ELECTRICAL_IGNITION_CAUSED_BY_OVERLOADING', 'OVERHEATED_HOME_APPLIANCES', 'IGNITION_OF_MATERIALS_FROM_EMBER_FLYING_EMBER_PALITAO', 'OPEN_FLAME_FROM_UNATTENDED_LIGHTED_CANDLE', 'OPEN_FLAME_FROM_FARMLAND_AGRICULTURAL_LAND_CLEARING_OPERATION', 'ELECTRICAL_IGNITION_CAUSED_BY_PINCHED_WIRE', 'OPEN_FLAME_FROM_KAINGIN', 'CHILDREN_PLAYING_WITH_MATCHSTICKS_OR_LIGHTER', 'BATTERY_SHORT_CIRCUIT_OR_BATTERY_EXPLOSION', 'INTENTIONAL_FIRE_BY_USE_OF_OPEN_FLAME', 'SPONTANEOUS_COMBUSTION_OF_SOLID_MATERIALS', 'OPEN_FLAME_FROM_KEROSENE_LAMP_OR_LIGHTING_TORCH', 'MAGNIFIED_AMPLIFIED_SUN_RAYS', 'INTENTIONAL_FIRE_BY_USE_OF_FLAMMABLE_LIQUID', 'IGNITION_OF_MATERIALS_CAUSED_BY_WELDING_SLAGS', 'OVERHEATED_ENGINE_MOTOR_VEHICLES', 'OVERHEATED_INDUSTRIAL_MACHINERY', 'ELECTRICAL_POST_FIRE_TO_STRUCTURAL_FIRE', 'IGNITION_OF_MATERIALS_CAUSED_BY_ACETYLENE_HOT_WORKS', 'SPARKS_FROM_MACHINERY', 'LPG_EXPLOSION_CAUSED_BY_DEFECTIVE_HOSELlNE', 'INTENTIONAL_FIRE_BY_USE_OF_INCENDIARY_DEVICE_OR_MECHANISM', 'SPONTANEOUS_COMBUSTION_OF_CHEMICALS', 'IGNITION_CAUSED_BY_FIRECRACKER_EXPLOSION', 'IGNITION_CAUSED_BY_FIREWORKS_PYROTECHNICS_EXPLOSION', 'LPG_EXPLOSION_CAUSED_BY_STATIC_ELECTRICITY_OR_SPARK', 'LPG_EXPLOSION_CAUSED_BY_DEFECTIVE_REGULATOR', 'LIGHTNING', 'LPG_EXPLOSION_CAUSED_BY_DEFECTIVE_TANK', 'LPG_EXPLOSION_CAUSED_BY_DEFECTIVE_STOVE', 'TRANSFORMER_POLE_FIRE_TO_STRUCTURAL_FIRE', 'DUST_EXPLOSION', 'IGNITION_CAUSED_BY_BOMB_EXPLOSION');

-- CreateEnum
CREATE TYPE "OfficeType" AS ENUM ('NATIONAL_HEADQUARTERS', 'REGIONAL_OFFICE', 'DISTRICT_FIRE_STATION', 'PROVINCIAL_FIRE_STATION', 'CITY_FIRE_STATION', 'MUNICIPAL_FIRE_STATION');

-- CreateEnum
CREATE TYPE "ROLE" AS ENUM ('SUPER_ADMIN', 'NHQ_ADMIN', 'NHQ_VIEWER', 'NHQ_CHIEF_INVESTIGATOR', 'NHQ_INVESTIGATOR', 'NHQ_OPERATION', 'NHQ_OPERATION_STAFF', 'REGIONAL_ADMIN', 'REGIONAL_OPERATION', 'REGIONAL_OPERATION_STAFF', 'REGIONAL_CHIEF_INVESTIGATOR', 'REGIONAL_INVESTIGATOR', 'REGIONAL_VIEWER', 'DISTRICT_PROVINCE_OPERATION', 'DISTRICT_PROVINCE_OPERATION_STAFF', 'DISTRICT_PROVINCE_CHIEF_INVESTIGATOR', 'DISTRICT_PROVINCE_INVESTIGATOR', 'DISTRICT_PROVINCE_VIEWER', 'CITY_MUNICIPALITY_OPERATION', 'CITY_MUNICIPALITYOPERATION_STAFF', 'CITY_MUNICIPALITYINVESTIGATOR', 'CITY_MUNICIPALITYCOMMEL');

-- CreateEnum
CREATE TYPE "RANK" AS ENUM ('FDIR', 'FCSUPT', 'FSSUPT', 'FSUPT', 'FCINSP', 'FSINSP', 'FINSP', 'SFO4', 'SFO3', 'SFO2', 'SFO1', 'FO3', 'FO2', 'FO1');

-- CreateTable
CREATE TABLE "InvestigationReport" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "findings" TEXT,
    "cause" TEXT,
    "conclusion" TEXT,
    "recommendations" TEXT,
    "status" "ReportStatus" NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvestigationReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Investigation" (
    "id" TEXT NOT NULL,
    "investigationNo" TEXT NOT NULL,
    "causeOfFire" "CauseOfFire",
    "classification" "FireCaseClassification",
    "originOfFire" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "fireIncidentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Investigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FireOpertaionResources" (
    "id" TEXT NOT NULL,
    "respondingTeam" TEXT,
    "fireTrucksResponded" INTEGER NOT NULL DEFAULT 0,
    "trucksBFPOwned" INTEGER NOT NULL DEFAULT 0,
    "trucksVolunteer" INTEGER NOT NULL DEFAULT 0,
    "trucksBFPManned" INTEGER NOT NULL DEFAULT 0,
    "ambulancesResponded" INTEGER NOT NULL DEFAULT 0,
    "ambulancesBFPOwned" INTEGER NOT NULL DEFAULT 0,
    "ambulancesVolunteer" INTEGER NOT NULL DEFAULT 0,
    "ambulancesBFPManned" INTEGER NOT NULL DEFAULT 0,
    "fireIncidentId" TEXT NOT NULL,

    CONSTRAINT "FireOpertaionResources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentImpact" (
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
    "fireIncidentId" TEXT NOT NULL,

    CONSTRAINT "IncidentImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentLocation" (
    "id" TEXT NOT NULL,
    "placeOfOccurence" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "province_district" TEXT,
    "city_municipality" TEXT,
    "fireIncidentId" TEXT NOT NULL,

    CONSTRAINT "IncidentLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentPersonnel" (
    "id" TEXT NOT NULL,
    "groundCommander" TEXT NOT NULL,
    "arsonInvestigator" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "fireIncidentId" TEXT NOT NULL,

    CONSTRAINT "IncidentPersonnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IncidentTimeline" (
    "id" TEXT NOT NULL,
    "fireIncidentId" TEXT NOT NULL,
    "status" "FireIncidentStatus" NOT NULL,
    "alarmLevel" "FireAlarmLevel",
    "occurredAt" TIMESTAMPTZ(3) NOT NULL,
    "remarks" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IncidentTimeline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL,
    "binBanNumber" TEXT,
    "name" TEXT NOT NULL,
    "ownerName" TEXT,
    "occupantName" TEXT,
    "totalLotFloorArea" DECIMAL(12,2),
    "contentStorage" TEXT,
    "numberOfStoreys" INTEGER,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FireIncident" (
    "id" TEXT NOT NULL,
    "incidentNo" TEXT NOT NULL,
    "dateTimeReported" TIMESTAMP(3),
    "dateTimeFireIncident" TIMESTAMP(3),
    "dateTimeCallReceived" TIMESTAMP(3),
    "dateTimeUnresponded" TIMESTAMP(3),
    "fireIncidentStatus" "FireIncidentStatus" NOT NULL,
    "currentAlarmLevel" "FireAlarmLevel",
    "categoryId" TEXT NOT NULL,
    "subcategoryId" TEXT,
    "establishmentId" TEXT,
    "createdById" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FireIncident_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FireIncidentCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CATEGORY_TYPE" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FireIncidentCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FireIncidentSubcategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FireIncidentSubcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" TEXT NOT NULL,
    "investigationUpdates" BOOLEAN NOT NULL DEFAULT true,
    "reportReview" BOOLEAN NOT NULL DEFAULT true,
    "systemAnnouncements" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "OfficeType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "regionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Position" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Position_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "account_number" TEXT NOT NULL,
    "rank" "RANK" NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "middle_name" TEXT,
    "password" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "officeId" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "role" "ROLE" NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InvestigationReport_investigationId_key" ON "InvestigationReport"("investigationId");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_investigationNo_key" ON "Investigation"("investigationNo");

-- CreateIndex
CREATE UNIQUE INDEX "Investigation_fireIncidentId_key" ON "Investigation"("fireIncidentId");

-- CreateIndex
CREATE UNIQUE INDEX "FireOpertaionResources_fireIncidentId_key" ON "FireOpertaionResources"("fireIncidentId");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentImpact_fireIncidentId_key" ON "IncidentImpact"("fireIncidentId");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentLocation_fireIncidentId_key" ON "IncidentLocation"("fireIncidentId");

-- CreateIndex
CREATE UNIQUE INDEX "IncidentPersonnel_fireIncidentId_key" ON "IncidentPersonnel"("fireIncidentId");

-- CreateIndex
CREATE INDEX "IncidentTimeline_fireIncidentId_occurredAt_idx" ON "IncidentTimeline"("fireIncidentId", "occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "Establishment_binBanNumber_key" ON "Establishment"("binBanNumber");

-- CreateIndex
CREATE UNIQUE INDEX "FireIncident_incidentNo_key" ON "FireIncident"("incidentNo");

-- CreateIndex
CREATE INDEX "FireIncident_categoryId_idx" ON "FireIncident"("categoryId");

-- CreateIndex
CREATE INDEX "FireIncident_subcategoryId_idx" ON "FireIncident"("subcategoryId");

-- CreateIndex
CREATE INDEX "FireIncident_dateTimeFireIncident_idx" ON "FireIncident"("dateTimeFireIncident");

-- CreateIndex
CREATE INDEX "FireIncident_fireIncidentStatus_idx" ON "FireIncident"("fireIncidentStatus");

-- CreateIndex
CREATE UNIQUE INDEX "FireIncidentCategory_name_key" ON "FireIncidentCategory"("name");

-- CreateIndex
CREATE INDEX "FireIncidentSubcategory_categoryId_idx" ON "FireIncidentSubcategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "FireIncidentSubcategory_categoryId_name_key" ON "FireIncidentSubcategory"("categoryId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE INDEX "Office_parentId_idx" ON "Office"("parentId");

-- CreateIndex
CREATE INDEX "Office_regionId_idx" ON "Office"("regionId");

-- CreateIndex
CREATE INDEX "Office_type_idx" ON "Office"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Position_name_key" ON "Position"("name");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_refreshToken_key" ON "RefreshToken"("refreshToken");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_account_number_key" ON "User"("account_number");

-- CreateIndex
CREATE INDEX "User_officeId_idx" ON "User"("officeId");

-- CreateIndex
CREATE INDEX "User_positionId_idx" ON "User"("positionId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- AddForeignKey
ALTER TABLE "InvestigationReport" ADD CONSTRAINT "InvestigationReport_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "Investigation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Investigation" ADD CONSTRAINT "Investigation_fireIncidentId_fkey" FOREIGN KEY ("fireIncidentId") REFERENCES "FireIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireOpertaionResources" ADD CONSTRAINT "FireOpertaionResources_fireIncidentId_fkey" FOREIGN KEY ("fireIncidentId") REFERENCES "FireIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentImpact" ADD CONSTRAINT "IncidentImpact_fireIncidentId_fkey" FOREIGN KEY ("fireIncidentId") REFERENCES "FireIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentLocation" ADD CONSTRAINT "IncidentLocation_fireIncidentId_fkey" FOREIGN KEY ("fireIncidentId") REFERENCES "FireIncident"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentPersonnel" ADD CONSTRAINT "IncidentPersonnel_fireIncidentId_fkey" FOREIGN KEY ("fireIncidentId") REFERENCES "FireIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IncidentTimeline" ADD CONSTRAINT "IncidentTimeline_fireIncidentId_fkey" FOREIGN KEY ("fireIncidentId") REFERENCES "FireIncident"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireIncident" ADD CONSTRAINT "FireIncident_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FireIncidentCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireIncident" ADD CONSTRAINT "FireIncident_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "FireIncidentSubcategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireIncident" ADD CONSTRAINT "FireIncident_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireIncident" ADD CONSTRAINT "FireIncident_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FireIncidentSubcategory" ADD CONSTRAINT "FireIncidentSubcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FireIncidentCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Office"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_officeId_fkey" FOREIGN KEY ("officeId") REFERENCES "Office"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "Position"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
