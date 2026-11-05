import { z } from 'zod';

export const openSessionSchema = z.object({
  openingBalance: z.number().min(0, 'Opening balance must be 0 or positive'),
  notes: z.string().optional().nullable(),
});

export const closeSessionSchema = z.object({
  closingBalance: z.number().min(0, 'Physical cash counted must be 0 or positive'),
  notes: z.string().optional().nullable(),
});
