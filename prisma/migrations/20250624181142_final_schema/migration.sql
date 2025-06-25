/*
  Warnings:

  - You are about to drop the column `approverWallet` on the `Verification` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Verification` table. All the data in the column will be lost.
  - You are about to drop the column `nftTokenId` on the `Verification` table. All the data in the column will be lost.
  - You are about to drop the column `txHash` on the `Verification` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Verification` table. All the data in the column will be lost.
  - Made the column `clientId` on table `UserToken` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `clientId` to the `Verification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `completedAt` to the `Verification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Verification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Verification` table without a default value. This is not possible if the table is not empty.
  - Added the required column `submittedAt` to the `Verification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "UserToken" DROP CONSTRAINT "UserToken_clientId_fkey";

-- DropIndex
DROP INDEX "Verification_nftTokenId_key";

-- AlterTable
ALTER TABLE "Skill" ADD COLUMN     "verificationId" UUID;

-- AlterTable
ALTER TABLE "UserToken" ALTER COLUMN "clientId" SET NOT NULL;

-- AlterTable
ALTER TABLE "Verification" DROP COLUMN "approverWallet",
DROP COLUMN "createdAt",
DROP COLUMN "nftTokenId",
DROP COLUMN "txHash",
DROP COLUMN "updatedAt",
ADD COLUMN     "clientId" UUID NOT NULL,
ADD COLUMN     "completedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "files" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "submittedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "status" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "UserToken" ADD CONSTRAINT "UserToken_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "Verification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
