/*
  Warnings:

  - You are about to drop the column `transactionHash` on the `Deposit` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[txnId]` on the table `Deposit` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[depositAddress]` on the table `Goal` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Deposit" DROP COLUMN "transactionHash",
ADD COLUMN     "txnId" TEXT;

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "depositAddress" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Deposit_txnId_key" ON "Deposit"("txnId");

-- CreateIndex
CREATE UNIQUE INDEX "Goal_depositAddress_key" ON "Goal"("depositAddress");
