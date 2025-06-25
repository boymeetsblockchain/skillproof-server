/*
  Warnings:

  - The `files` column on the `Verification` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `clientWalletAddress` to the `Verification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Verification" ADD COLUMN     "clientWalletAddress" TEXT NOT NULL,
DROP COLUMN "files",
ADD COLUMN     "files" TEXT[];
