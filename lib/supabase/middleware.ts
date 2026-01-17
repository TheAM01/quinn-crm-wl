import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!hasEnvVars) return supabaseResponse;

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
                request.cookies.set(name, value),
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options),
            );
          },
        },
      },
  );

  // Must stay right after client creation
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  const path = request.nextUrl.pathname;
  const search = request.nextUrl.search; // includes ?a=1&b=2
  const full = `${path}${search}`;

  const isAuthRoute =
      path.startsWith("/login") ||
      path.startsWith("/auth");

  if (path !== "/" && !user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.search = `?redirect-to=${encodeURIComponent(full)}`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
