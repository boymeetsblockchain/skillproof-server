/*
  Warnings:

  - You are about to drop the column `clientId` on the `UserToken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "UserToken" DROP CONSTRAINT "UserToken_clientId_fkey";

-- AlterTable
ALTER TABLE "UserToken" DROP COLUMN "clientId";

-- CreateTable
CREATE TABLE "ClientToken" (
    "id" TEXT NOT NULL,
    "type" "TOKEN_TYPE" NOT NULL,
    "token" TEXT NOT NULL,
    "client_id" UUID NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClientToken_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ClientToken" ADD CONSTRAINT "ClientToken_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
