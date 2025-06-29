import { z } from 'zod';
import { PromptBlockType } from '@prisma/client';

// Schéma pour les paramètres d'URL (ex: /api/blocks/:id)
export const blockIdParamSchema = z.object({
  id: z.string().cuid({ message: "Format CUID invalide" }),
});

// Schéma pour le corps de la requête de création
export const createBlockBodySchema = z.object({
  name: z.string().min(1, { message: "Le nom ne peut pas être vide" }).max(255, { message: "Le nom ne peut pas dépasser 255 caractères" }),
  content: z.string().min(1, { message: "Le contenu ne peut pas être vide" }).max(100000, { message: "Le contenu ne peut pas dépasser 100 000 caractères" }),
  type: z.nativeEnum(PromptBlockType, { message: "Type de bloc invalide" }),
  category: z.string().max(255, { message: "La catégorie ne peut pas dépasser 255 caractères" }).optional(),
  color: z.string().max(50, { message: "La couleur ne peut pas dépasser 50 caractères" }).optional(),
});

// Schéma pour le corps de la requête de mise à jour
export const updateBlockBodySchema = z.object({
  name: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  type: z.nativeEnum(PromptBlockType).optional(),
  category: z.string().optional(),
  color: z.string().optional(),
});

// Types TypeScript dérivés des schémas
export type BlockIdParam = z.infer<typeof blockIdParamSchema>;
export type CreateBlockBody = z.infer<typeof createBlockBodySchema>;
export type UpdateBlockBody = z.infer<typeof updateBlockBodySchema>;