import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "Telegram not configured" }, { status: 500 });
  }

  const { id, phone_number, caller_name, question, answer, call_direction, is_sorted } = await request.json();

  const direction = call_direction === "inbound" ? "📲 Incoming" : "📞 Outgoing";
  const sortedLabel = is_sorted ? "✅ Sorted" : "🔴 Unsorted";
  const lines = [
    `${direction} call logged — ${sortedLabel}`,
    `📱 ${caller_name ? `${caller_name} (${phone_number})` : phone_number}`,
    question ? `❓ ${question}` : null,
    answer ? `💬 ${answer}` : null,
  ].filter(Boolean).join("\n");

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text: lines,
  };

  // Add "Mark as sorted" button only if not already sorted
  if (id && !is_sorted) {
    body.reply_markup = {
      inline_keyboard: [[
        { text: "✅ Mark as sorted", callback_data: `sort:${id}` },
      ]],
    };
  }

  const res = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
