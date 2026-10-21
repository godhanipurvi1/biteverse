import { createHash, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";

export function randomToken(): string {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is missing from apps/api/.env");
  return secret;
}

function sessionDays(): number {
  return Number(process.env.COOKIE_MAX_AGE_DAYS ?? 7);
}

export function signSession(userId: string): string {
  return jwt.sign({ sub: userId }, jwtSecret(), {
    expiresIn: sessionDays() * 24 * 60 * 60,
  });
}

export function verifySession(token: string): string {
  const payload = jwt.verify(token, jwtSecret());
  if (typeof payload === "string" || typeof payload.sub !== "string") {
    throw new Error("Invalid session token");
  }
  return payload.sub;
}

export const sessionCookie = {
  name: () => process.env.COOKIE_NAME ?? "biteverse_session",
  options: () => ({
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDays() * 24 * 60 * 60 * 1000,
  }),
};
