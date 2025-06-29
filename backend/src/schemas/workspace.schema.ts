import { z } from 'zod';

// Schéma pour les paramètres d'URL (ex: /api/workspaces/:id)
export const workspaceIdParamSchema = z.object({
  id: z.string().cuid({ message: "Format CUID invalide" }),
});

// Schéma pour le corps de la requête de création
export const createWorkspaceBodySchema = z.object({
  name: z.string().min(1, { message: "Le nom ne peut pas être vide" }),
  path: z.string().min(1, { message: "Le chemin est requis" }),
  defaultCompositionId: z.string().cuid().nullable().optional().or(z.literal('')),
  ignorePatterns: z.array(z.string()).default([]),
  projectInfo: z.string().optional(),
});

// Schéma pour le corps de la requête de mise à jour
export const updateWorkspaceBodySchema = z.object({
  name: z.string().min(1).optional(),
  path: z.string().min(1).optional(),
  selectedFiles: z.array(z.string()).optional(),
  lastFinalRequest: z.string().optional(),
  defaultCompositionId: z.string().cuid().nullable().optional(),
  ignorePatterns: z.array(z.string()).optional(),
  projectInfo: z.string().optional(),
});

// Types TypeScript dérivés des schémas
export type WorkspaceIdParam = z.infer<typeof workspaceIdParamSchema>;
export type CreateWorkspaceBody = z.infer<typeof createWorkspaceBodySchema>;
export type UpdateWorkspaceBody = z.infer<typeof updateWorkspaceBodySchema>;