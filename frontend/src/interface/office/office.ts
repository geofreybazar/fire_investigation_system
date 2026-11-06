import { z } from "zod";
import type { Pagination } from "../pagination";

export const officeSchema = z.object({
  name: z.string().min(2, "Office name is required."),
  parentId: z.string().optional(),
  regionCode: z.string().optional(),
  type: z.enum(
    [
      "NATIONAL_HEADQUARTERS",
      "REGIONAL_OFFICE",
      "DISTRICT_FIRE_STATION",
      "PROVINCIAL_FIRE_STATION",
      "CITY_FIRE_STATION",
      "MUNICIPAL_FIRE_STATION",
    ],
    {
      error: "Please select an office type.",
    },
  ),
});

export type OfficeInput = z.infer<typeof officeSchema>;

export interface UpdateOfficeInput extends OfficeInput {
  officeId: string;
}

export interface OfficeParent extends OfficeInput {
  id: string;
  regionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Office extends OfficeInput {
  id: string;
  name: string;
  regionId?: string;
  parent?: OfficeParent;
  createdAt: string;
  updatedAt: string;
}

export interface GetAllOffices {
  data: Office[];
  pagination: Pagination;
}
