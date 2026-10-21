import { cookies } from "next/headers";
import type { PublicUser } from "./auth.api";

const COOKIE_NAME = "biteverse_session";
const API_URL = process.env.API_URL ?? "http://localhost:4000";

// Runs on the server, so protected pages can check the session before rendering.
export async function getServerUser(): Promise<PublicUser | null> {
  const jar = await cookies();
  const session = jar.get(COOKIE_NAME);
  if (!session) return null;

  const res = await fetch(`${API_URL}/api/auth/me`, {
    headers: { cookie: `${COOKIE_NAME}=${session.value}` },
    cache: "no-store",
  });
  if (!res.ok) return null;

  const data = (await res.json()) as { user: PublicUser };
  return data.user;
}
