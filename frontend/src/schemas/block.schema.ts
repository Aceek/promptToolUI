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
  name: z.string().min(1, "Le nom ne peut pas être vide").max(255, "Le nom ne peut pas dépasser 255 caractères"),
  content: z.string().max(100000, "Le contenu ne peut pas dépasser 100 000 caractères"),
  type: PromptBlockTypeEnum,
  category: z.string().max(255, "La catégorie ne peut pas dépasser 255 caractères").optional(),
  color: z.string().max(50, "La couleur ne peut pas dépasser 50 caractères").optional(),
}).refine((data) => {
  // Pour les blocs DYNAMIC_TASK, le contenu peut être vide car il sera généré automatiquement
  if (data.type === 'DYNAMIC_TASK') {
    return true;
  }
  // Pour les autres types, le contenu est requis
  return data.content.length > 0;
}, {
  message: "Le contenu ne peut pas être vide",
  path: ["content"]
});

export type BlockFormData = z.infer<typeof blockFormSchema>;