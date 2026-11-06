import { z } from "zod";
import { normalizeInput } from "@/utils/normalizeInput";
import type { FireIncidentCategory } from "../incidentClassification/incidentClassification";

export const fireIncidentSubCategoriesSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .transform(normalizeInput),
  categoryId: z.uuid({ message: "Category ID is required" }),
});

export type FireIncidentSubCategoriesInput = z.infer<
  typeof fireIncidentSubCategoriesSchema
>;

// A subcategory stays under its category; only the name can change.
export const editFireIncidentSubCategorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .transform(normalizeInput),
});

export type EditFireIncidentSubCategoryInput = z.infer<
  typeof editFireIncidentSubCategorySchema
>;

export interface FireIncidentSubCategory extends FireIncidentSubCategoriesInput {
  id: string;
  categoryId: string;
  category: FireIncidentCategory;
  incidents: any[];
  createdAt: string;
  updatedAt: string;
}
