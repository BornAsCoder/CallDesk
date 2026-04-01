import { NextResponse } from "next/server";
import { buildTelegramMessage } from "../_shared";

export async function POST(request: Request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return NextResponse.json({ error: "Telegram not configured" }, { status: 500 });
  }

  const { message_id, call_log_id, phone_number, caller_name, question, answer, call_direction, is_sorted } =
    await request.json();

  if (!message_id) {
    return NextResponse.json({ ok: true });
  }

  const { text, reply_markup } = buildTelegramMessage({
    id: call_log_id,
    phone_number,
    caller_name,
    question,
    answer,
    call_direction,
    is_sorted,
  });

  await fetch(`https://api.telegram.org/bot${token}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id,
      text,
      reply_markup,
    }),
  });

  return NextResponse.json({ ok: true });
}
