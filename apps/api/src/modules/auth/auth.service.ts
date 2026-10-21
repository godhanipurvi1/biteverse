import bcrypt from "bcryptjs";
import type { LoginInput, ResetPasswordInput, SignupInput, VerifyEmailInput } from "@biteverse/shared";
import { HttpError } from "../../lib/errors.js";
import { hashToken, randomToken } from "../../lib/tokens.js";
import { User } from "../users/user.model.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const appUrl = () => process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

export function toPublicUser(user: {
  _id: unknown;
  name: string;
  email: string;
  phone: string;
  role: string;
  emailVerified: boolean;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    emailVerified: user.emailVerified,
  };
}

export async function signup(input: SignupInput) {
  const taken = await User.exists({ $or: [{ email: input.email }, { phone: input.phone }] });
  if (taken) throw new HttpError(409, "Email or phone is already registered");

  const verifyToken = randomToken();
  const user = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, 12),
    emailVerifyTokenHash: hashToken(verifyToken),
    emailVerifyExpires: new Date(Date.now() + DAY_MS),
  });

  // No email provider yet, so the link is printed to the API console.
  console.log(`[dev] Verify ${user.email}: ${appUrl()}/verify-email?token=${verifyToken}`);
  return user;
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  const valid = user ? await bcrypt.compare(input.password, user.passwordHash) : false;
  if (!user || !valid) throw new HttpError(401, "Email or password is incorrect");
  return user;
}

export async function verifyEmail(input: VerifyEmailInput) {
  const user = await User.findOneAndUpdate(
    { emailVerifyTokenHash: hashToken(input.token), emailVerifyExpires: { $gt: new Date() } },
    { $set: { emailVerified: true }, $unset: { emailVerifyTokenHash: 1, emailVerifyExpires: 1 } },
  );
  if (!user) throw new HttpError(400, "This verification link is invalid or has expired");
}

export async function forgotPassword(email: string) {
  const token = randomToken();
  const user = await User.findOneAndUpdate(
    { email },
    { $set: { resetTokenHash: hashToken(token), resetExpires: new Date(Date.now() + HOUR_MS) } },
  );
  if (user) console.log(`[dev] Reset for ${email}: ${appUrl()}/reset-password?token=${token}`);
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await User.findOneAndUpdate(
    { resetTokenHash: hashToken(input.token), resetExpires: { $gt: new Date() } },
    {
      $set: { passwordHash: await bcrypt.hash(input.password, 12) },
      $unset: { resetTokenHash: 1, resetExpires: 1 },
    },
  );
  if (!user) throw new HttpError(400, "This reset link is invalid or has expired");
}
