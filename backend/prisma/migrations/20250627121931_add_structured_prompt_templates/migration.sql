/*
  Warnings:

  - You are about to drop the column `content` on the `PromptTemplate` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PromptTemplate" DROP COLUMN "content",
ADD COLUMN     "code_content_header" TEXT NOT NULL DEFAULT 'CODE CONTENT',
ADD COLUMN     "file_separator" TEXT NOT NULL DEFAULT '---------------------------------------------------------------------------',
ADD COLUMN     "format_header" TEXT NOT NULL DEFAULT 'FORMAT INSTRUCTIONS',
ADD COLUMN     "project_info_header" TEXT NOT NULL DEFAULT 'PROJECT INFORMATION',
ADD COLUMN     "role_intro" TEXT NOT NULL DEFAULT 'You are an expert software engineer. Your persona:',
ADD COLUMN     "structure_header" TEXT NOT NULL DEFAULT 'PROJECT STRUCTURE',
ADD COLUMN     "task_format_reminder" TEXT NOT NULL DEFAULT 'Your response must strictly follow the format specified in the FORMAT INSTRUCTIONS section below. This format is crucial for proper processing of your response.',
ADD COLUMN     "task_header" TEXT NOT NULL DEFAULT 'DYNAMIC TASK - USER REQUEST',
ADD COLUMN     "task_static_intro" TEXT NOT NULL DEFAULT '[The following is the specific task you need to accomplish. While the rest of this prompt provides static context and guidelines, this section represents the dynamic user request that changes with each prompt generation.]';
