import z from "zod";
import { normalizeInput } from "@/utils/normalizeInput";

import type { Pagination } from "../pagination";
import type { User } from "../users/users";

export const positionSchema = z.object({
  name: z
    .string()
    .min(2, "Position name is required.")
    .transform(normalizeInput),
});

export type PositionInput = z.infer<typeof positionSchema>;

export interface UpdatePositionInput extends PositionInput {
  positionId: string;
}

export interface Position extends PositionInput {
  id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users: User[];
}

export interface PaginatedPositions {
  data: Position[];
  pagination: Pagination;
}
