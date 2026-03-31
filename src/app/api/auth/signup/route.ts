import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(request: Request) {
  try {
    const { fullName, companyName, email, password } = await request.json();

    if (!fullName || !email || !password || !companyName) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Generate unique slug
    let slug = generateSlug(companyName);
    const { data: existingOrg } = await admin
      .from("organizations")
      .select("id")
      .eq("slug", slug)
      .single();

    if (existingOrg) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    // 1. Create organization
    const { data: org, error: orgError } = await admin
      .from("organizations")
      .insert({ name: companyName, slug })
      .select()
      .single();

    if (orgError) {
      return NextResponse.json(
        { error: "Failed to create organization" },
        { status: 500 }
      );
    }

    // 2. Create auth user
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        organization_id: org.id,
      },
    });

    if (authError) {
      await admin.from("organizations").delete().eq("id", org.id);
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      );
    }

    // 3. Create profile (first user is admin)
    const { error: profileError } = await admin.from("profiles").insert({
      id: authData.user.id,
      organization_id: org.id,
      email,
      full_name: fullName,
      role: "admin",
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(authData.user.id);
      await admin.from("organizations").delete().eq("id", org.id);
      return NextResponse.json(
        { error: "Failed to create profile" },
        { status: 500 }
      );
    }

    // 4. Sign in
    const supabase = await createClient();
    await supabase.auth.signInWithPassword({ email, password });

    return NextResponse.json({
      success: true,
      organization: { id: org.id, slug: org.slug },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
