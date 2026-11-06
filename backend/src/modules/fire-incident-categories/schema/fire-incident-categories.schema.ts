import { z } from 'zod';
import { normalizInput } from '../../../common/utils/normalizeInput.js';
import { CATEGORY_TYPE } from '../../../generated/prisma/enums.js';

export const fireIncidentCategoriesSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .transform(normalizInput),
  type: z.enum(CATEGORY_TYPE),
});

export type FireIncidentCategoriesInput = z.infer<
  typeof fireIncidentCategoriesSchema
>;
