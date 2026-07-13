import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Only refresh the token here — the actual auth guards run in the layouts
  // (requireOwnerVenue → getUser). getSession() reads the token from the cookie
  // locally and only hits the network when it genuinely needs refreshing, so a
  // normal tab switch with a valid token costs zero round trips instead of a
  // full transatlantic getUser() validation on every navigation.
  await supabase.auth.getSession();

  return supabaseResponse;
}
