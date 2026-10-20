import { describe, it, expect } from "vitest";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "../src/schemas/auth";

const validSignup = {
  name: "Ravi",
  email: "ravi@example.com",
  phone: "9876543210",
  password: "secret123",
};

describe("signupSchema", () => {
  it("accepts a valid signup", () => {
    expect(signupSchema.safeParse(validSignup).success).toBe(true);
  });

  it("normalizes email case and whitespace", () => {
    const r = signupSchema.parse({ ...validSignup, email: "  Ravi@Example.COM " });
    expect(r.email).toBe("ravi@example.com");
  });

  it("rejects a name shorter than 2 or longer than 60 characters", () => {
    expect(signupSchema.safeParse({ ...validSignup, name: "R" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...validSignup, name: "a".repeat(61) }).success).toBe(false);
  });

  it("rejects a bad email", () => {
    expect(signupSchema.safeParse({ ...validSignup, email: "not-an-email" }).success).toBe(false);
  });

  it("rejects phone numbers that are not 10-digit Indian mobiles", () => {
    expect(signupSchema.safeParse({ ...validSignup, phone: "12345" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...validSignup, phone: "5876543210" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...validSignup, phone: "98765432101" }).success).toBe(false);
  });

  it("rejects a password under 8 characters or without a number", () => {
    expect(signupSchema.safeParse({ ...validSignup, password: "abc12" }).success).toBe(false);
    expect(signupSchema.safeParse({ ...validSignup, password: "password" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts an email and any non-empty password", () => {
    expect(loginSchema.safeParse({ email: "ravi@example.com", password: "x" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "ravi@example.com", password: "" }).success).toBe(false);
  });
});

describe("token and email schemas", () => {
  it("requires a verification token", () => {
    expect(verifyEmailSchema.safeParse({ token: "" }).success).toBe(false);
    expect(verifyEmailSchema.safeParse({ token: "abc" }).success).toBe(true);
  });

  it("validates forgot-password email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "ravi@example.com" }).success).toBe(true);
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(false);
  });

  it("applies the password rule on reset", () => {
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "newpass1" }).success).toBe(true);
    expect(resetPasswordSchema.safeParse({ token: "abc", password: "short" }).success).toBe(false);
    expect(resetPasswordSchema.safeParse({ token: "", password: "newpass1" }).success).toBe(false);
  });
});