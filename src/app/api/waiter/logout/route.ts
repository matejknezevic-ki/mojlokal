import { NextResponse } from "next/server";
import { WAITER_COOKIE } from "@/lib/waiter-auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(WAITER_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
