import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/students",
  "/alerts",
  "/interventions",
  "/nudge-engine",
  "/student",
  "/admin",
];
const TPC_ONLY_PREFIXES = [
  "/dashboard",
  "/students",
  "/alerts",
  "/interventions",
  "/nudge-engine",
  "/admin",
];
const STUDENT_ONLY_PREFIXES = ["/student"];
const AUTH_ROUTES = new Set(["/login", "/register"]);

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.has(pathname);
}

function matchesAnyPrefix(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next();
  }

  const cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }> = [];

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(nextCookies: Array<{ name: string; value: string; options: CookieOptions }>) {
        nextCookies.forEach((cookie) => {
          cookiesToSet.push({
            name: cookie.name,
            value: cookie.value,
            options: cookie.options,
          });
        });
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let role: string | null = null;
  if (session) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    role = profile?.role || null;
  }

  const withCookies = (response: NextResponse) => {
    cookiesToSet.forEach((cookie) => {
      response.cookies.set(cookie.name, cookie.value, cookie.options);
    });
    return response;
  };

  if (isProtectedRoute(pathname) && !session) {
    const loginUrl = new URL("/login", request.url);
    return withCookies(NextResponse.redirect(loginUrl));
  }

  if (session && role === "student" && matchesAnyPrefix(pathname, TPC_ONLY_PREFIXES)) {
    return withCookies(NextResponse.redirect(new URL("/student", request.url)));
  }

  if (session && role === "tpc_admin" && matchesAnyPrefix(pathname, STUDENT_ONLY_PREFIXES)) {
    return withCookies(NextResponse.redirect(new URL("/dashboard", request.url)));
  }

  if (isAuthRoute(pathname) && session) {
    const destination = role === "student" ? "/student" : "/dashboard";
    return withCookies(NextResponse.redirect(new URL(destination, request.url)));
  }

  return withCookies(NextResponse.next());
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/students/:path*",
    "/alerts/:path*",
    "/interventions/:path*",
    "/nudge-engine/:path*",
    "/student/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
