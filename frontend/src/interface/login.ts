import { z } from "zod";

export const loginSchema = z.object({
  account_number: z.string().min(6, "Account number is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginType = z.infer<typeof loginSchema>;
