import { z } from 'zod';

// Schéma pour le corps de la requête de mise à jour des paramètres
export const updateSettingsBodySchema = z.object({
  globalIgnorePatterns: z.array(z.string()).optional(),
});

// Types TypeScript dérivés des schémas
export type UpdateSettingsBody = z.infer<typeof updateSettingsBodySchema>;