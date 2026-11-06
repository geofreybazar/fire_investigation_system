import z from "zod";
import { normalizeInput } from "@/utils/normalizeInput";

import type { Office } from "../office/office";
import type { Position } from "../positions/positions";
import type { Pagination } from "../pagination";
import { RANKS, ROLE } from "@/constants/personnel";

export const changePasswordSchema = z.object({
  userId: z.string(),
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(12, "Password must be at least 12 characters long.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(
      /[^A-Za-z0-9]/,
      "Password must contain at least one special character.",
    ),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const addNewUserSchema = z.object({
  account_number: z
    .string()
    .min(6, "Invalid Account number")
    .max(10, "Invalid Account number")
    .transform((value) => value.toUpperCase()),
  rank: z.enum(RANKS),
  first_name: z.string().trim().min(2).transform(normalizeInput),
  last_name: z.string().trim().min(2).transform(normalizeInput),
  middle_name: z.string().trim().transform(normalizeInput).optional(),
  email: z
    .email()
    .trim()
    .transform((value) => value.trim().toLowerCase()),
  role: z.enum(ROLE),
  officeId: z.uuid(),
  positionId: z.uuid(),
});
export type AddNewUserInput = z.infer<typeof addNewUserSchema>;

export interface User extends AddNewUserInput {
  id: string;
  office: Office;
  position: Position;
  isActive: boolean;
  mustChangePassword?: boolean;
}

export interface GetAllPersonnel {
  data: User[];
  pagination: Pagination;
}

export interface ChangeUserStatus {
  userId: string;
  isActive: boolean;
}

export interface EditUserInput extends AddNewUserInput {
  userId: string;
}
