import { z } from 'zod';

// Schéma pour le corps de la requête de mise à jour des paramètres
export const updateSettingsBodySchema = z.object({
  globalIgnorePatterns: z.array(z.string().max(500, { message: "Un pattern ne peut pas dépasser 500 caractères" })).max(200, { message: "Vous ne pouvez pas avoir plus de 200 patterns d'exclusion globaux" }).optional(),
});

// Types TypeScript dérivés des schémas
export type UpdateSettingsBody = z.infer<typeof updateSettingsBodySchema>;