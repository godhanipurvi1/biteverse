import { z } from "zod";

const name = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters")
  .max(60, "Name must be 60 characters or fewer");

const email = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

// 10-digit Indian mobile number, starting with 6 to 9
const phone = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number");

const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/\d/, "Password must include a number");

export const signupSchema = z.object({
  name,
  email,
  phone,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password"),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Verification link is missing its token"),
});

export const forgotPasswordSchema = z.object({
  email,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset link is missing its token"),
  password,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;