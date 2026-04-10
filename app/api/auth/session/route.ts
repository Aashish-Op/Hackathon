import { cookies } from "next/headers";
import { NextResponse } from "next/server";

type SessionUser = {
  email: string;
  role: "tpc_admin";
  displayName: string;
};

const SESSION_COOKIE_NAME = "vigilo_session";

function readSessionUser(rawToken: string | undefined): SessionUser | null {
  if (!rawToken) {
    return null;
  }

  try {
    const decoded = Buffer.from(rawToken, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as Partial<SessionUser>;

    if (
      typeof parsed.email !== "string" ||
      parsed.email.length === 0 ||
      parsed.role !== "tpc_admin" ||
      typeof parsed.displayName !== "string" ||
      parsed.displayName.length === 0
    ) {
      return null;
    }

    return {
      email: parsed.email,
      role: parsed.role,
      displayName: parsed.displayName,
    };
  } catch {
    return null;
  }
}

export async function GET() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const user = readSessionUser(rawToken);

  if (!user) {
    return NextResponse.json({ authenticated: false, user: null }, { status: 200 });
  }

  return NextResponse.json({ authenticated: true, user }, { status: 200 });
}
