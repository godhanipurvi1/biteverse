import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../lib/errors.js";
import { sessionCookie, verifySession } from "../lib/tokens.js";
import { User, type UserRole } from "../modules/users/user.model.js";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; role: UserRole };
    }
  }
}

// Loads the user on every request, so role changes and password resets take effect at once.
export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[sessionCookie.name()];
    if (!token) throw new HttpError(401, "Please log in to continue");

    const { sub, v } = verifySession(token);
    const user = await User.findById(sub).select("role sessionVersion");
    if (!user || user.sessionVersion !== v) {
      throw new HttpError(401, "Please log in to continue");
    }

    req.user = { id: String(user._id), role: user.role as UserRole };
    next();
  } catch (err) {
    next(err instanceof HttpError ? err : new HttpError(401, "Please log in to continue"));
  }
}
