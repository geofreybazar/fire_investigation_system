import { z } from 'zod';
import { normalizInput } from '../../../common/utils/normalizeInput.js';

import { ROLE } from '../../../generated/prisma/enums.js';
import { RANK } from '../../../generated/prisma/enums.js';

export const userSchema = z.object({
  account_number: z
    .string()
    .min(6, 'Invalid Account number')
    .max(10, 'Invalid Account number')
    .transform((value) => value.toUpperCase()),
  rank: z.enum(RANK),
  first_name: z.string().trim().min(2).transform(normalizInput),
  last_name: z.string().trim().min(2).transform(normalizInput),
  middle_name: z.string().trim().transform(normalizInput).optional(),
  email: z
    .email()
    .trim()
    .transform((value) => value.trim().toLowerCase()),
  role: z.enum(ROLE),
  officeId: z.uuid(),
  positionId: z.uuid(),
});
export type UserInput = z.infer<typeof userSchema>;

export const loginSchema = z.object({
  account_number: z.string(),
  password: z.string(),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const changePasswordSchema = z.object({
  // Only checked against the stored hash; the policy applies to the new password.
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters long.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.')
    .regex(
      /[^A-Za-z0-9]/,
      'Password must contain at least one special character.',
    ),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const changeUserStatusSchema = z.object({
  isActive: z.boolean(),
});
export type ChangeUserStatusInput = z.infer<typeof changeUserStatusSchema>;
