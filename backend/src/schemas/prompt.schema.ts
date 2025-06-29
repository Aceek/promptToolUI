import { z } from 'zod';

// Schéma pour la génération de prompt
export const generatePromptBodySchema = z.object({
  workspaceId: z.string().cuid({ message: "Format CUID invalide pour workspaceId" }),
  orderedBlockIds: z.array(z.string().cuid()).min(1, { message: "Au moins un bloc est requis" }).max(100, { message: "Vous ne pouvez pas utiliser plus de 100 blocs" }),
  finalRequest: z.string().max(100000, { message: "La requête finale ne peut pas dépasser 100 000 caractères" }).optional(),
  selectedFilePaths: z.array(z.string().max(2048, { message: "Un chemin de fichier ne peut pas dépasser 2048 caractères" })).max(1000, { message: "Vous ne pouvez pas sélectionner plus de 1000 fichiers" }).optional(),
});

// Schéma pour la génération de prompt depuis une composition
export const generateFromCompositionBodySchema = z.object({
  workspaceId: z.string().cuid({ message: "Format CUID invalide pour workspaceId" }),
  compositionId: z.string().cuid({ message: "Format CUID invalide pour compositionId" }),
  finalRequest: z.string().max(100000, { message: "La requête finale ne peut pas dépasser 100 000 caractères" }).optional(),
  selectedFilePaths: z.array(z.string().max(2048, { message: "Un chemin de fichier ne peut pas dépasser 2048 caractères" })).max(1000, { message: "Vous ne pouvez pas sélectionner plus de 1000 fichiers" }).optional(),
});

// Types TypeScript dérivés des schémas
export type GeneratePromptBody = z.infer<typeof generatePromptBodySchema>;
export type GenerateFromCompositionBody = z.infer<typeof generateFromCompositionBodySchema>;