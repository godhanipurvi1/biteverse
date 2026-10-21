import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors.js";
import type { UserRole } from "../modules/users/user.model.js";

// Use after requireAuth: requireAuth, requireRole("admin")
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new HttpError(401, "Please log in to continue"));
    if (!roles.includes(req.user.role)) {
      return next(new HttpError(403, "You do not have access to this page"));
    }
    next();
  };
}
