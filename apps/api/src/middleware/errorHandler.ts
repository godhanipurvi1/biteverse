import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../lib/errors.js";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: err.issues[0]?.message ?? "Invalid input" });
  }
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.message });
  }
  if (typeof err === "object" && err !== null && "code" in err && err.code === 11000) {
    return res.status(409).json({ error: "Email or phone is already registered" });
  }
  console.error(err);
  return res.status(500).json({ error: "Something went wrong" });
}
