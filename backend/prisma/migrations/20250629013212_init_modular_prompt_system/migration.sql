/*
  Warnings:

  - You are about to drop the column `defaultFormatId` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `defaultPromptTemplateId` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the column `defaultRoleId` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the `Format` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PromptTemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Role` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "PromptBlockType" AS ENUM ('STATIC', 'DYNAMIC_TASK', 'PROJECT_STRUCTURE', 'SELECTED_FILES_CONTENT', 'PROJECT_INFO');

-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_defaultFormatId_fkey";

-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_defaultPromptTemplateId_fkey";

-- DropForeignKey
ALTER TABLE "Workspace" DROP CONSTRAINT "Workspace_defaultRoleId_fkey";

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "defaultFormatId",
DROP COLUMN "defaultPromptTemplateId",
DROP COLUMN "defaultRoleId",
ADD COLUMN     "defaultCompositionId" TEXT;

-- DropTable
DROP TABLE "Format";

-- DropTable
DROP TABLE "PromptTemplate";

-- DropTable
DROP TABLE "Role";

-- CreateTable
CREATE TABLE "PromptBlock" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "PromptBlockType" NOT NULL DEFAULT 'STATIC',
    "category" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptComposition" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PromptComposition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PromptCompositionBlocks" (
    "id" TEXT NOT NULL,
    "compositionId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    CONSTRAINT "PromptCompositionBlocks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PromptComposition_name_key" ON "PromptComposition"("name");

-- CreateIndex
CREATE UNIQUE INDEX "PromptCompositionBlocks_compositionId_order_key" ON "PromptCompositionBlocks"("compositionId", "order");

-- AddForeignKey
ALTER TABLE "PromptCompositionBlocks" ADD CONSTRAINT "PromptCompositionBlocks_compositionId_fkey" FOREIGN KEY ("compositionId") REFERENCES "PromptComposition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PromptCompositionBlocks" ADD CONSTRAINT "PromptCompositionBlocks_blockId_fkey" FOREIGN KEY ("blockId") REFERENCES "PromptBlock"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Workspace" ADD CONSTRAINT "Workspace_defaultCompositionId_fkey" FOREIGN KEY ("defaultCompositionId") REFERENCES "PromptComposition"("id") ON DELETE SET NULL ON UPDATE CASCADE;
