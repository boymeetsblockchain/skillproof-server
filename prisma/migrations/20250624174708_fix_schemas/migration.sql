/*
  Warnings:

  - You are about to drop the column `projectId` on the `Verification` table. All the data in the column will be lost.
  - You are about to drop the `Project` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProjectToSkill` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Project" DROP CONSTRAINT "Project_userId_fkey";

-- DropForeignKey
ALTER TABLE "Verification" DROP CONSTRAINT "Verification_projectId_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectToSkill" DROP CONSTRAINT "_ProjectToSkill_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProjectToSkill" DROP CONSTRAINT "_ProjectToSkill_B_fkey";

-- DropIndex
DROP INDEX "Verification_projectId_key";

-- AlterTable
ALTER TABLE "UserToken" ADD COLUMN     "clientId" UUID;

-- AlterTable
ALTER TABLE "Verification" DROP COLUMN "projectId";

-- DropTable
DROP TABLE "Project";

-- DropTable
DROP TABLE "_ProjectToSkill";

-- CreateTable
CREATE TABLE "Client" (
    "id" UUID NOT NULL,
    "walletAddress" VARCHAR(100) NOT NULL,
    "username" VARCHAR(50),
    "email" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_walletAddress_key" ON "Client"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
