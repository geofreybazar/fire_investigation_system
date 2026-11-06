import { z } from 'zod';

export const officeSchema = z.object({
  // Trimmed, with repeated spaces collapsed, so near-identical names match.
  name: z
    .string()
    .trim()
    .min(5, 'Office name is required')
    .transform((name) => name.replace(/\s+/g, ' ')),
  type: z.enum([
    'NATIONAL_HEADQUARTERS',
    'REGIONAL_OFFICE',
    'DISTRICT_FIRE_STATION',
    'PROVINCIAL_FIRE_STATION',
    'CITY_FIRE_STATION',
    'MUNICIPAL_FIRE_STATION',
  ]),
  regionCode: z.string().optional(),
  parentId: z.uuid().optional(),
});

export type OfficeInput = z.infer<typeof officeSchema>;
