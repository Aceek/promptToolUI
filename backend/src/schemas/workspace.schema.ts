import { z } from 'zod';

// Schéma pour les paramètres d'URL (ex: /api/workspaces/:id)
export const workspaceIdParamSchema = z.object({
  id: z.string().cuid({ message: "Format CUID invalide" }),
});

// Schéma pour le corps de la requête de création
export const createWorkspaceBodySchema = z.object({
  name: z.string().min(1, { message: "Le nom ne peut pas être vide" }).max(255, { message: "Le nom ne peut pas dépasser 255 caractères" }),
  path: z.string().min(1, { message: "Le chemin est requis" }).max(1024, { message: "Le chemin ne peut pas dépasser 1024 caractères" }),
  defaultCompositionId: z.string().cuid().nullable().optional().or(z.literal('')),
  ignorePatterns: z.array(z.string().max(500, { message: "Un pattern ne peut pas dépasser 500 caractères" })).max(200, { message: "Vous ne pouvez pas avoir plus de 200 patterns d'exclusion" }).default([]),
  projectInfo: z.string().max(50000, { message: "Les informations du projet ne peuvent pas dépasser 50 000 caractères" }).optional(),
});

// Schéma pour le corps de la requête de mise à jour
export const updateWorkspaceBodySchema = z.object({
  name: z.string().min(1).max(255, { message: "Le nom ne peut pas dépasser 255 caractères" }).optional(),
  path: z.string().min(1).max(1024, { message: "Le chemin ne peut pas dépasser 1024 caractères" }).optional(),
  selectedFiles: z.array(z.string().max(2048, { message: "Un chemin de fichier ne peut pas dépasser 2048 caractères" })).max(1000, { message: "Vous ne pouvez pas sélectionner plus de 1000 fichiers" }).optional(),
  lastFinalRequest: z.string().max(100000, { message: "La dernière requête ne peut pas dépasser 100 000 caractères" }).optional(),
  defaultCompositionId: z.string().cuid().nullable().optional(),
  ignorePatterns: z.array(z.string().max(500, { message: "Un pattern ne peut pas dépasser 500 caractères" })).max(200, { message: "Vous ne pouvez pas avoir plus de 200 patterns d'exclusion" }).optional(),
  projectInfo: z.string().max(50000, { message: "Les informations du projet ne peuvent pas dépasser 50 000 caractères" }).optional(),
});

// Types TypeScript dérivés des schémas
export type WorkspaceIdParam = z.infer<typeof workspaceIdParamSchema>;
export type CreateWorkspaceBody = z.infer<typeof createWorkspaceBodySchema>;
export type UpdateWorkspaceBody = z.infer<typeof updateWorkspaceBodySchema>;