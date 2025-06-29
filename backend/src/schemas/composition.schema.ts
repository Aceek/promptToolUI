import { z } from 'zod';

// Schéma pour les paramètres d'URL (ex: /api/compositions/:id)
export const compositionIdParamSchema = z.object({
  id: z.string().cuid({ message: "Format CUID invalide" }),
});

// Schéma pour le corps de la requête de création
export const createCompositionBodySchema = z.object({
  name: z.string().min(1, { message: "Le nom ne peut pas être vide" }),
  blockIds: z.array(z.string().cuid()).min(1, { message: "Au moins un bloc est requis" }),
});

// Schéma pour le corps de la requête de mise à jour
export const updateCompositionBodySchema = z.object({
  name: z.string().min(1).optional(),
  blockIds: z.array(z.string().cuid()).min(1).optional(),
});

// Types TypeScript dérivés des schémas
export type CompositionIdParam = z.infer<typeof compositionIdParamSchema>;
export type CreateCompositionBody = z.infer<typeof createCompositionBodySchema>;
export type UpdateCompositionBody = z.infer<typeof updateCompositionBodySchema>;