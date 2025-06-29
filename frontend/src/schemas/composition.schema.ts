import { z } from 'zod';

export const compositionFormSchema = z.object({
  name: z.string().min(1, "Le nom ne peut pas être vide").max(255, "Le nom ne peut pas dépasser 255 caractères"),
  selectedBlockIds: z.array(z.string().cuid()).min(1, "Au moins un bloc est requis").max(100, "Une composition ne peut pas contenir plus de 100 blocs"),
});

export type CompositionFormData = z.infer<typeof compositionFormSchema>;