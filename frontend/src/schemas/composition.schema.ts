import { z } from 'zod';

export const compositionFormSchema = z.object({
  name: z.string().min(1, "Le nom ne peut pas être vide"),
  selectedBlockIds: z.array(z.string().cuid()).min(1, "Au moins un bloc est requis"),
});

export type CompositionFormData = z.infer<typeof compositionFormSchema>;