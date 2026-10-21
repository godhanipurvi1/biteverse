import { api } from "@/lib/api/client";

export type Role = "customer" | "admin";

export type PublicUser = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  emailVerified: boolean;
};

type Message = { message: string };

export function signup(input: { name: string; email: string; phone: string; password: string }) {
  return api<{ user: PublicUser } & Message>("/auth/signup", { body: input });
}

export function login(input: { email: string; password: string }) {
  return api<{ user: PublicUser }>("/auth/login", { body: input });
}

export function logout() {
  return api<null>("/auth/logout", { method: "POST" });
}

export async function getMe(): Promise<PublicUser> {
  const data = await api<{ user: PublicUser }>("/auth/me");
  return data.user;
}

export function verifyEmail(token: string) {
  return api<Message>("/auth/verify-email", { body: { token } });
}

export function forgotPassword(email: string) {
  return api<Message>("/auth/forgot-password", { body: { email } });
}

export function resetPassword(input: { token: string; password: string }) {
  return api<Message>("/auth/reset-password", { body: input });
}
