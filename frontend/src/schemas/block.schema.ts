import { z } from 'zod';

// Enum synchronisé avec Prisma PromptBlockType
export const PromptBlockTypeEnum = z.enum([
  'STATIC',
  'DYNAMIC_TASK',
  'PROJECT_STRUCTURE',
  'SELECTED_FILES_CONTENT',
  'PROJECT_INFO'
], {
  errorMap: () => ({ message: "Type de bloc invalide" })
});

export const blockFormSchema = z.object({
  name: z.string().min(1, "Le nom ne peut pas être vide"),
  content: z.string().min(1, "Le contenu ne peut pas être vide"),
  type: PromptBlockTypeEnum,
  category: z.string().optional(),
  color: z.string().optional(),
});

export type BlockFormData = z.infer<typeof blockFormSchema>;