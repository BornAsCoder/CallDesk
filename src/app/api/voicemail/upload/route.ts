import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "voicemails";

async function ensureBucket(admin: ReturnType<typeof createAdminClient>) {
  const { data: buckets } = await admin.storage.listBuckets();
  const existing = buckets?.find((b) => b.id === BUCKET);
  if (!existing) {
    await admin.storage.createBucket(BUCKET, { public: true });
  } else if (!existing.public) {
    await admin.storage.updateBucket(BUCKET, { public: true });
  }
}

export async function POST(request: Request) {
  // Verify the user is authenticated
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const orgId = formData.get("org_id") as string;
  const ext = (formData.get("ext") as string) || "m4a";

  if (!file || !orgId) {
    return NextResponse.json({ error: "Missing file or org_id" }, { status: 400 });
  }

  const admin = createAdminClient();

  // Ensure bucket exists
  await ensureBucket(admin);

  const path = `${orgId}/${Date.now()}.${ext}`;
  const contentType = file.type || `audio/${ext === "m4a" ? "mp4" : ext}`;

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType, upsert: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: data.publicUrl });
}
