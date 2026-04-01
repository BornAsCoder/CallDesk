-- Add telegram_message_id to call_logs so we can delete messages from the chat
ALTER TABLE public.call_logs
  ADD COLUMN IF NOT EXISTS telegram_message_id BIGINT;
