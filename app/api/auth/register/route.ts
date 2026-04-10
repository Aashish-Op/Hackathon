import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type RegisterRequest = {
  fullName?: string;
  email?: string;
  password?: string;
  role?: "tpc_admin" | "student";
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getServerSupabaseConfig() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return { supabaseUrl, serviceRoleKey };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as RegisterRequest;

  const fullName = (body.fullName || "").trim();
  const email = (body.email || "").trim().toLowerCase();
  const password = body.password || "";
  const role: "tpc_admin" | "student" = body.role === "student" ? "student" : "tpc_admin";

  if (fullName.length < 2) {
    return NextResponse.json({ error: "Full name must be at least 2 characters." }, { status: 400 });
  }

  if (!EMAIL_PATTERN.test(email)) {
    return NextResponse.json({ error: "Invalid email format." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const serverConfig = getServerSupabaseConfig();
  if (!serverConfig) {
    return NextResponse.json(
      {
        error:
          "Server registration is not configured. Add SUPABASE_URL and SUPABASE_KEY (or SUPABASE_SERVICE_ROLE_KEY) to .env.local and restart Next.js.",
      },
      { status: 500 },
    );
  }

  const adminClient = createClient(serverConfig.supabaseUrl, serverConfig.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const existingProfile = await adminClient
    .from("profiles")
    .select("id")
    .eq("email", email)
    .limit(1)
    .maybeSingle();

  if (existingProfile.error) {
    return NextResponse.json({ error: existingProfile.error.message }, { status: 500 });
  }

  if (existingProfile.data?.id) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      role,
    },
  });

  if (createError || !created.user) {
    const message = createError?.message || "Unable to create account";
    const lower = message.toLowerCase();
    const status = lower.includes("already") || lower.includes("registered") ? 409 : 400;
    return NextResponse.json({ error: message }, { status });
  }

  const userId = created.user.id;

  const { error: profileError } = await adminClient.from("profiles").insert({
    id: userId,
    full_name: fullName,
    email,
    role,
  });

  if (profileError) {
    await adminClient.auth.admin.deleteUser(userId);
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (role === "student") {
    const { error: studentProfileError } = await adminClient.from("student_profiles").upsert({
      id: userId,
    });

    if (studentProfileError) {
      return NextResponse.json({ error: studentProfileError.message }, { status: 500 });
    }
  }

  return NextResponse.json(
    {
      ok: true,
      message: "Account created. You can sign in now.",
    },
    { status: 201 },
  );
}
