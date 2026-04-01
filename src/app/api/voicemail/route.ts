import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/voicemail
 *
 * Attach a voicemail recording to an existing call log.
 * Accepts multipart/form-data with:
 *   - file: audio file (required)
 *   - call_log_id: UUID of the call log (optional — if omitted, matches latest unsorted call)
 *   - transcription: text transcription (optional)
 *   - api_key: must match VOICEMAIL_API_KEY env var
 *
 * Designed to be called from iOS Shortcuts:
 *   1. Share audio → Shortcuts → "Get Contents of URL"
 *   2. POST multipart to https://yourapp.com/api/voicemail
 */
export async function POST(request: Request) {
  const apiKey = process.env.VOICEMAIL_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "VOICEMAIL_API_KEY not configured" }, { status: 500 });
  }

  const formData = await request.formData();
  const key = formData.get("api_key") as string;

  if (key !== apiKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const callLogId = formData.get("call_log_id") as string | null;
  const transcription = formData.get("transcription") as string | null;

  const admin = createAdminClient();

  // Find the call log to attach to
  let logId = callLogId;
  let orgId: string | undefined;

  if (logId) {
    const { data: log } = await admin
      .from("call_logs")
      .select("id, organization_id")
      .eq("id", logId)
      .single();
    if (!log) {
      return NextResponse.json({ error: "Call log not found" }, { status: 404 });
    }
    orgId = log.organization_id;
  } else {
    // Match the most recent unsorted call without a recording
    const { data: log } = await admin
      .from("call_logs")
      .select("id, organization_id")
      .is("recording_url", null)
      .eq("is_sorted", false)
      .order("call_date", { ascending: false })
      .limit(1)
      .single();

    if (!log) {
      return NextResponse.json({ error: "No matching call log found" }, { status: 404 });
    }
    logId = log.id;
    orgId = log.organization_id;
  }

  // Upload to Supabase storage
  const ext = file.name.split(".").pop()?.toLowerCase() || "m4a";
  const path = `${orgId}/${logId}.${ext}`;
  const { error: uploadError } = await admin.storage
    .from("voicemails")
    .upload(path, file, {
      contentType: file.type || `audio/${ext === "m4a" ? "mp4" : ext}`,
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = admin.storage
    .from("voicemails")
    .getPublicUrl(path);

  // Update the call log
  const updates: Record<string, string | null> = {
    recording_url: urlData.publicUrl,
  };
  if (transcription) {
    updates.transcription = transcription;
  }

  const { data: updated, error: updateError } = await admin
    .from("call_logs")
    .update(updates)
    .eq("id", logId)
    .select("*, telegram_message_id")
    .single();

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Send audio to Telegram if configured
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    // If there's an existing Telegram message, send audio as a reply
    await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        audio: urlData.publicUrl,
        title: `Voicemail — ${updated.caller_name || updated.phone_number}`,
        caption: transcription || undefined,
        reply_to_message_id: updated.telegram_message_id || undefined,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, call_log_id: logId });
}
