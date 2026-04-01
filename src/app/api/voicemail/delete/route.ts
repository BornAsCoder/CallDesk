import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "voicemails";

export async function POST(request: Request) {
  const { recording_url } = await request.json();

  if (!recording_url) {
    return NextResponse.json({ ok: true });
  }

  // Extract storage path from the public URL
  // URL format: https://<ref>.supabase.co/storage/v1/object/public/voicemails/<path>
  const marker = `/object/public/${BUCKET}/`;
  const idx = recording_url.indexOf(marker);
  if (idx === -1) {
    return NextResponse.json({ ok: true });
  }

  const path = decodeURIComponent(recording_url.slice(idx + marker.length));

  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET).remove([path]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
