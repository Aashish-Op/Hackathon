import { NextResponse } from "next/server";

const SESSION_COOKIE_NAME = "vigilo_session";

export async function POST() {
  const response = NextResponse.json({ ok: true, message: "Signed out." }, { status: 200 });

  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
  });

  return response;
}
