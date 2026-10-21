import rateLimit from "express-rate-limit";

// Applies to login, signup, forgot password, and resend verification.
// Counts every attempt per IP. Set AUTH_RATE_LIMIT in .env to change the limit.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT ?? 30),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts. Please try again in 15 minutes." },
});
