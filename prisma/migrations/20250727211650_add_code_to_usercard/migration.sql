/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `UserCard` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserCard" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserCard_code_key" ON "UserCard"("code");
