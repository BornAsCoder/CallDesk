import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return NextResponse.json({ ok: true });

  const body = await request.json();
  const callbackQuery = body.callback_query;
  if (!callbackQuery) return NextResponse.json({ ok: true });

  const callbackId = callbackQuery.id;
  const data: string = callbackQuery.data ?? "";

  if (data.startsWith("sort:")) {
    const logId = data.slice(5);
    const admin = createAdminClient();

    const { error } = await admin
      .from("call_logs")
      .update({ is_sorted: true })
      .eq("id", logId);

    if (error) {
      // Answer the callback with error
      await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ callback_query_id: callbackId, text: "❌ Failed to update" }),
      });
      return NextResponse.json({ ok: true });
    }

    // Edit the original message to remove the button and update label
    const msg = callbackQuery.message;
    const updatedText = msg.text.replace("🔴 Unsorted", "✅ Sorted");
    await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: msg.chat.id,
        message_id: msg.message_id,
        text: updatedText,
        reply_markup: { inline_keyboard: [] },
      }),
    });

    // Confirm the tap
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackId, text: "✅ Marked as sorted!" }),
    });
  }

  return NextResponse.json({ ok: true });
}
