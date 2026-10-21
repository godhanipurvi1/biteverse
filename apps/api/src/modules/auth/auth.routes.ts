import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { authLimiter } from "../../middleware/authLimiter.js";
import * as c from "./auth.controller.js";

export const authRouter = Router();

// Rate limited: each attempt counts, so guessing passwords or spamming email is capped.
authRouter.post("/signup", authLimiter, c.signupHandler);
authRouter.post("/login", authLimiter, c.loginHandler);
authRouter.post("/forgot-password", authLimiter, c.forgotPasswordHandler);
authRouter.post("/resend-verification", authLimiter, c.resendVerificationHandler);

// Not rate limited: they need a valid one-time token, and logout is harmless.
authRouter.post("/logout", c.logoutHandler);
authRouter.get("/me", requireAuth, c.meHandler);
authRouter.post("/verify-email", c.verifyEmailHandler);
authRouter.post("/reset-password", c.resetPasswordHandler);
