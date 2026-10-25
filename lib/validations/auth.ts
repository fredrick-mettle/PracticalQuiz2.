import { z } from "zod";

/** Ghana phone: 0XXXXXXXXX or +233XXXXXXXXX (spaces/dashes tolerated). */
export const ghanaPhoneRegex = /^(\+233|0)([\s-]?\d){9}$/;

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
  email: z.email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(
      ghanaPhoneRegex,
      "Enter a valid Ghana phone number (e.g. 0241234567)"
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/\d/, "Password must contain at least one number"),
  // Self-registration can never create an ADMIN account.
  role: z.enum(["TENANT", "AGENT"]),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
