import { z } from 'zod';
import { normalizInput } from '../../../common/utils/normalizeInput.js';

const subcategoryName = z
  .string()
  .min(1, { message: 'Name is required' })
  .transform(normalizInput);

export const fireIncidentSubCategoriesSchema = z.object({
  name: subcategoryName,
  categoryId: z.uuid({ message: 'Invalid category ID' }),
});

export type FireIncidentSubCategoriesInput = z.infer<
  typeof fireIncidentSubCategoriesSchema
>;

// A subcategory stays under its category; only the name can change.
export const editFireIncidentSubCategorySchema = z.object({
  name: subcategoryName,
});

export type EditFireIncidentSubCategoryInput = z.infer<
  typeof editFireIncidentSubCategorySchema
>;
