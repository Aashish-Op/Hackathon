import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

type ProfileRole = "tpc_admin" | "student";

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(new URL("/login", request.url));
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

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    await supabase.auth.exchangeCodeForSession(code);
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  let destination = "/login";

  if (session?.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    destination = (profile?.role as ProfileRole | undefined) === "student" ? "/student" : "/dashboard";
  }

  const response = NextResponse.redirect(new URL(destination, request.url));
  cookiesToSet.forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value, cookie.options);
  });

  return response;
}
