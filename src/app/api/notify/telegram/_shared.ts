interface CallLogData {
  id?: string;
  phone_number: string;
  caller_name?: string | null;
  question?: string | null;
  answer?: string | null;
  call_direction?: string;
  is_sorted?: boolean;
  recording_url?: string | null;
  transcription?: string | null;
}

export function buildTelegramMessage(data: CallLogData) {
  const direction = data.call_direction === "inbound" ? "\ud83d\udcf2 Incoming" : "\ud83d\udcde Outgoing";
  const sortedLabel = data.is_sorted ? "\u2705 Sorted" : "\ud83d\udd34 Unsorted";
  const text = [
    `${direction} call logged \u2014 ${sortedLabel}`,
    `\ud83d\udcf1 ${data.caller_name ? `${data.caller_name} (${data.phone_number})` : data.phone_number}`,
    data.question ? `\u2753 ${data.question}` : null,
    data.answer ? `\ud83d\udcac ${data.answer}` : null,
    data.recording_url ? `\ud83c\udfa4 Voicemail attached` : null,
    data.transcription ? `\ud83d\udcdd ${data.transcription}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const reply_markup =
    data.id && !data.is_sorted
      ? { inline_keyboard: [[{ text: "\u2705 Mark as sorted", callback_data: `sort:${data.id}` }]] }
      : { inline_keyboard: [] };

  return { text, reply_markup };
}
