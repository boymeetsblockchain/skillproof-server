-- DropForeignKey
ALTER TABLE "Verification" DROP CONSTRAINT "Verification_clientId_fkey";

-- AlterTable
ALTER TABLE "Verification" ALTER COLUMN "clientId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;
