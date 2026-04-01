import { NextResponse } from "next/server";
import { buildTelegramMessage } from "./_shared";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "Telegram not configured" }, { status: 500 });
  }

  const data = await request.json();
  const { text, reply_markup } = buildTelegramMessage(data);

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, reply_markup }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  const result = await res.json();
  const message_id = result.result?.message_id;

  // Send voicemail as playable audio if attached
  if (data.recording_url) {
    await fetch(`https://api.telegram.org/bot${token}/sendAudio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        audio: data.recording_url,
        title: `Voicemail — ${data.caller_name || data.phone_number}`,
        reply_to_message_id: message_id,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, message_id });
}
