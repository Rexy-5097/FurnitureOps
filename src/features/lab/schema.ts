import { z } from 'zod';

/**
 * Schema-based validation (INT252 Unit IV, INT257 Unit III/IV).
 * One Zod schema is shared by the client form, the Server Action and the
 * Route Handlers, so the browser and the server agree on what "valid" means.
 */

export const CATEGORIES = ['seating', 'tables', 'lighting', 'storage', 'beds', 'decor'] as const;
export type Category = (typeof CATEGORIES)[number];

export const ItemInputSchema = z.object({
  name: z
    .string({ required_error: 'Give the piece a name' })
    .trim()
    .min(3, 'Name needs at least 3 characters')
    .max(60, 'Keep the name under 60 characters'),
  origin: z.string().trim().min(2, 'Where was it made?').max(40),
  category: z.enum(CATEGORIES, { errorMap: () => ({ message: 'Choose a category' }) }),
  material: z.string().trim().min(2, 'Name the main material').max(40),
  price: z.coerce
    .number({ invalid_type_error: 'Price must be a number' })
    .positive('Price must be greater than 0')
    .max(5_000_000, 'That is more than the showroom can insure'),
  quantity_available: z.coerce
    .number({ invalid_type_error: 'Stock must be a number' })
    .int('Stock must be a whole number')
    .min(0, 'Stock cannot be negative')
    .max(999),
  tone: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a hex colour like #8B5A3C'),
  description: z.string().trim().max(280, 'Keep it under 280 characters').optional().default(''),
});

export type ItemInput = z.infer<typeof ItemInputSchema>;

/** PATCH accepts any subset of the create fields. */
export const ItemPatchSchema = ItemInputSchema.partial();
export type ItemPatch = z.infer<typeof ItemPatchSchema>;

export type LabItem = ItemInput & {
  id: string;
  quantity_sold: number;
  image_url: string | null;
  created_at: string;
  updated_at: string | null;
};

/** Flattens a ZodError into `{ field: firstMessage }` for form display. */
export const toFieldErrors = (error: z.ZodError): Partial<Record<keyof ItemInput, string>> =>
  Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).map(([key, messages]) => [key, messages?.[0]]),
  );
