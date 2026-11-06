/*
  Warnings:

  - A unique constraint covering the columns `[regionCode]` on the table `Office` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Office_regionCode_key" ON "Office"("regionCode");
