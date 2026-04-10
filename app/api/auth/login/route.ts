import { NextResponse } from "next/server";

type LoginRequest = {
  email?: string;
  password?: string;
  provider?: "password" | "sso";
  remember?: boolean;
};

type SessionUser = {
  email: string;
  role: "tpc_admin";
  displayName: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SESSION_COOKIE_NAME = "vigilo_session";

function toDisplayName(email: string) {
  const identifier = email.split("@")[0] ?? "user";
  return identifier
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as LoginRequest;

  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  const provider = body.provider ?? "password";

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  if (provider === "password" && password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const user: SessionUser = {
    email,
    role: "tpc_admin",
    displayName: toDisplayName(email),
  };

  const sessionToken = Buffer.from(JSON.stringify(user), "utf8").toString("base64url");

  const response = {
    ok: true,
    message: provider === "sso" ? "SSO sign-in successful. Redirecting..." : "Sign-in successful. Redirecting...",
    user,
    remember: Boolean(body.remember),
  };

  const nextResponse = NextResponse.json(response, { status: 200 });
  nextResponse.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: sessionToken,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: body.remember ? 60 * 60 * 24 * 7 : undefined,
  });

  return nextResponse;
}
