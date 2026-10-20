import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseKey, supabaseUrl } from "@/lib/supabase/env";

// Refreshes the Supabase session cookie on every request and does the fast redirects.
// The /app page checks the session again on the server; this is only the first gate.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  const path = request.nextUrl.pathname;
  const join = request.nextUrl.searchParams.get("join");

  if (!signedIn && (path === "/app" || path.startsWith("/app/"))) {
    return redirectKeepingCookies(request, response, "/login", join);
  }
  if (signedIn && (path === "/login" || path === "/signup")) {
    return redirectKeepingCookies(request, response, "/app", join);
  }
  return response;
}

function redirectKeepingCookies(
  request: NextRequest,
  response: NextResponse,
  pathname: string,
  join: string | null,
) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = join ? `?join=${encodeURIComponent(join)}` : "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
