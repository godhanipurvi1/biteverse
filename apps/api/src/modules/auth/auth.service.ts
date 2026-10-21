import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import type {
  LoginInput,
  ResetPasswordInput,
  SignupInput,
  VerifyEmailInput,
} from "@biteverse/shared";
import { HttpError } from "../../lib/errors.js";
import { sendMail } from "../../lib/mailer.js";
import { hashToken, randomToken } from "../../lib/tokens.js";
import { User } from "../users/user.model.js";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const appUrl = () => process.env.CLIENT_ORIGIN ?? "http://localhost:3000";

// Used when the email is unknown, so login takes the same time either way.
const DUMMY_HASH = bcrypt.hashSync(randomBytes(16).toString("hex"), 12);

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

async function issueVerification(user: { _id: unknown; email: string }) {
  const token = randomToken();
  await User.updateOne(
    { _id: user._id },
    { $set: { emailVerifyTokenHash: hashToken(token), emailVerifyExpires: new Date(Date.now() + DAY_MS) } },
  );
  await sendMail({
    to: user.email,
    subject: "Verify your BiteVerse email",
    text: `Verify your email: ${appUrl()}/verify-email?token=${token}\nThis link expires in 24 hours.`,
  });
}

export async function signup(input: SignupInput) {
  const taken = await User.exists({ $or: [{ email: input.email }, { phone: input.phone }] });
  if (taken) throw new HttpError(409, "Email or phone is already registered");

  const user = await User.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    passwordHash: await bcrypt.hash(input.password, 12),
  });
  await issueVerification(user);
  return user;
}

const RESEND_COOLDOWN_MS = 60 * 1000;
// The token expires 24h after it was sent, so expiry minus one day is the send time.
function sentRecently(expires?: Date | null) {
  return !!expires && expires.getTime() - DAY_MS > Date.now() - RESEND_COOLDOWN_MS;
}

export async function resendVerification(email: string) {
  const user = await User.findOne({ email: email.toLowerCase() }).select("emailVerified emailVerifyExpires");
  if (user && !user.emailVerified && !sentRecently(user.emailVerifyExpires)) {
    await issueVerification(user);
  }
  // Same response either way, so this can't reveal which emails are registered.
}

export async function login(input: LoginInput) {
  const user = await User.findOne({ email: input.email }).select("+passwordHash");
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const valid = await bcrypt.compare(input.password, hash);
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
    { email: email.toLowerCase() },
    { $set: { resetTokenHash: hashToken(token), resetExpires: new Date(Date.now() + HOUR_MS) } },
  );
  if (user) {
    await sendMail({
      to: user.email,
      subject: "Reset your BiteVerse password",
      text: `Reset your password: ${appUrl()}/reset-password?token=${token}\nThis link expires in 1 hour.`,
    });
  }
  // Same response either way, so this can't reveal which emails are registered.
}

export async function resetPassword(input: ResetPasswordInput) {
  const user = await User.findOneAndUpdate(
    { resetTokenHash: hashToken(input.token), resetExpires: { $gt: new Date() } },
    {
      $set: { passwordHash: await bcrypt.hash(input.password, 12) },
      $unset: { resetTokenHash: 1, resetExpires: 1 },
      // Bumping the version invalidates every session issued before the reset.
      $inc: { sessionVersion: 1 },
    },
  );
  if (!user) throw new HttpError(400, "This reset link is invalid or has expired");
}
