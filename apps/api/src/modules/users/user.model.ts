import { Schema, model, type InferSchemaType } from "mongoose";

export const ROLES = ["customer", "admin"];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: "customer" },
    emailVerified: { type: Boolean, default: false },
    emailVerifyTokenHash: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    resetTokenHash: { type: String, select: false },
    resetExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

export type UserRole = "customer" | "admin";
export type UserDoc = InferSchemaType<typeof userSchema>;
export const User = model("User", userSchema);
