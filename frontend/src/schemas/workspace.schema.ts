import { z } from 'zod';

export const workspaceFormSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères").max(255, "Le nom ne peut pas dépasser 255 caractères"),
  path: z.string().min(1, "Le chemin est requis").max(1024, "Le chemin ne peut pas dépasser 1024 caractères"),
  defaultCompositionId: z.string().optional().or(z.literal('')),
  projectInfo: z.string().max(50000, "Les informations du projet ne peuvent pas dépasser 50 000 caractères").optional(),
  ignorePatterns: z.string().max(100000, "Les patterns d'exclusion ne peuvent pas dépasser 100 000 caractères").optional(), // On valide le textarea comme une seule chaîne
});

export type WorkspaceFormData = z.infer<typeof workspaceFormSchema>;