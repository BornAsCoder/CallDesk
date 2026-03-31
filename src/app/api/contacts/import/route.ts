import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "No profile found" }, { status: 400 });
    }

    const { contacts } = await request.json();

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { error: "No contacts provided" },
        { status: 400 }
      );
    }

    const rows = contacts.map(
      (c: { name: string; phone_number: string; email?: string }) => ({
        organization_id: profile.organization_id,
        name: c.name,
        phone_number: c.phone_number,
        email: c.email || null,
        source: "vcf_import",
        created_by: user.id,
      })
    );

    const { data, error } = await supabase
      .from("contacts")
      .upsert(rows, {
        onConflict: "organization_id,phone_number",
        ignoreDuplicates: false,
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: data.length });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
