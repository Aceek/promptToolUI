/*
  Warnings:

  - You are about to drop the column `isSystemBlock` on the `PromptBlock` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "SystemBlockBehavior" AS ENUM ('NONE', 'SYSTEM', 'INDELETABLE');

-- AlterTable
ALTER TABLE "PromptBlock" DROP COLUMN "isSystemBlock",
ADD COLUMN     "systemBehavior" "SystemBlockBehavior" NOT NULL DEFAULT 'NONE';
