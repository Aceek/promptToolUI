import { z } from 'zod';

export const workspaceFormSchema = z.object({
  name: z.string().min(3, "Le nom doit contenir au moins 3 caractères"),
  path: z.string().min(1, "Le chemin est requis"),
  defaultCompositionId: z.string().optional().or(z.literal('')),
  projectInfo: z.string().optional(),
  ignorePatterns: z.string().optional(), // On valide le textarea comme une seule chaîne
});

export type WorkspaceFormData = z.infer<typeof workspaceFormSchema>;