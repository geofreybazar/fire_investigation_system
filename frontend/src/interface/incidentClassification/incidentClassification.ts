import { z } from "zod";
import { normalizeInput } from "@/utils/normalizeInput";
import type { Pagination } from "../pagination";
import type { FireIncidentSubCategory } from "../incidentSubClassification/incidentSubClassification";
import { CATEGORY_TYPE } from "@/constants/classification";

export const fireIncidentCategoriesSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .transform(normalizeInput),
  type: z.enum(CATEGORY_TYPE, "Invalid category type"),
});

export type FireIncidentCategoriesInput = z.infer<
  typeof fireIncidentCategoriesSchema
>;

export interface FireIncidentCategory extends FireIncidentCategoriesInput {
  id: string;
  createdAt: string;
  updatedAt: string;
  subCategories: FireIncidentSubCategory[];
  _count: { incidents: number };
}

export interface GetAllFireIncidentCategories {
  data: FireIncidentCategory[];
  pagination: Pagination;
}

export interface EditFireIncidentCategoriesInput extends FireIncidentCategoriesInput {
  fireIncidentCategoryId: string;
}
