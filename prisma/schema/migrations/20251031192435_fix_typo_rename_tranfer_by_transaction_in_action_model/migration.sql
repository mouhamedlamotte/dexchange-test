/*
  Warnings:

  - You are about to drop the column `transferId` on the `Action` table. All the data in the column will be lost.
  - Added the required column `transactionId` to the `Action` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."Action" DROP CONSTRAINT "Action_transferId_fkey";

-- AlterTable
ALTER TABLE "Action" DROP COLUMN "transferId",
ADD COLUMN     "transactionId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
