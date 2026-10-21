import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import * as c from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/signup", c.signupHandler);
authRouter.post("/login", c.loginHandler);
authRouter.post("/logout", c.logoutHandler);
authRouter.get("/me", requireAuth, c.meHandler);
authRouter.post("/verify-email", c.verifyEmailHandler);
authRouter.post("/forgot-password", c.forgotPasswordHandler);
authRouter.post("/reset-password", c.resetPasswordHandler);
