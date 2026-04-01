import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "Telegram not configured" }, { status: 500 });
  }

  const { phone_number, caller_name, question, answer, call_direction } = await request.json();

  const direction = call_direction === "inbound" ? "📲 Incoming" : "📞 Outgoing";
  const lines = [
    `${direction} call logged`,
    `📱 ${caller_name ? `${caller_name} (${phone_number})` : phone_number}`,
    question ? `❓ ${question}` : null,
    answer ? `✅ ${answer}` : null,
  ].filter(Boolean).join("\n");

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: lines }),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
