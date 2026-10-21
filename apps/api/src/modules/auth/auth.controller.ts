import type { Request, Response } from "express";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  verifyEmailSchema,
} from "@biteverse/shared";
import { HttpError } from "../../lib/errors.js";
import { sessionCookie, signSession } from "../../lib/tokens.js";
import { User } from "../users/user.model.js";
import * as service from "./auth.service.js";

export async function signupHandler(req: Request, res: Response) {
  const user = await service.signup(signupSchema.parse(req.body));
  res.status(201).json({
    user: service.toPublicUser(user),
    message: "Account created. Verify your email to continue.",
  });
}

export async function loginHandler(req: Request, res: Response) {
  const user = await service.login(loginSchema.parse(req.body));
  res.cookie(sessionCookie.name(), signSession(String(user._id)), sessionCookie.options());
  res.json({ user: service.toPublicUser(user) });
}

export function logoutHandler(_req: Request, res: Response) {
  res.clearCookie(sessionCookie.name(), { path: "/" });
  res.status(204).end();
}

export async function meHandler(req: Request, res: Response) {
  const user = req.user ? await User.findById(req.user.id) : null;
  if (!user) throw new HttpError(401, "Please log in to continue");
  res.json({ user: service.toPublicUser(user) });
}

export async function verifyEmailHandler(req: Request, res: Response) {
  await service.verifyEmail(verifyEmailSchema.parse(req.body));
  res.json({ message: "Email verified" });
}

export async function forgotPasswordHandler(req: Request, res: Response) {
  await service.forgotPassword(forgotPasswordSchema.parse(req.body).email);
  res.json({ message: "If that email is registered, a reset link is on its way" });
}

export async function resetPasswordHandler(req: Request, res: Response) {
  await service.resetPassword(resetPasswordSchema.parse(req.body));
  res.json({ message: "Password updated. You can log in now." });
}
