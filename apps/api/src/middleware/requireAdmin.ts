import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors.js";
import { requireAuth } from "./auth.js";

// Logs the user in first, then allows only admins through.
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, (err?: unknown) => {
    if (err) return next(err);
    if (req.user?.role !== "admin") return next(new HttpError(403, "Admin access only"));
    next();
  });
}
