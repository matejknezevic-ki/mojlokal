import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

export const WAITER_COOKIE = "waiter_session";
const SESSION_HOURS = 14; // covers a long double shift

export type WaiterSession = {
  waiterId: string;
  venueId: string;
  venueSlug: string;
  name: string;
};

function getSecret() {
  const secret = process.env.WAITER_SESSION_SECRET;
  if (!secret) throw new Error("WAITER_SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function signWaiterSession(session: WaiterSession): Promise<string> {
  return new SignJWT({
    wid: session.waiterId,
    vid: session.venueId,
    slug: session.venueSlug,
    name: session.name,
    role: "waiter",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_HOURS}h`)
    .sign(getSecret());
}

export async function getWaiterSession(): Promise<WaiterSession | null> {
  const store = await cookies();
  const token = store.get(WAITER_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.role !== "waiter") return null;
    return {
      waiterId: String(payload.wid),
      venueId: String(payload.vid),
      venueSlug: String(payload.slug ?? ""),
      name: String(payload.name ?? ""),
    };
  } catch {
    return null;
  }
}

export function waiterCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_HOURS * 60 * 60,
  };
}
