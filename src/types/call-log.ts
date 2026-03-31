export type CallDirection = "inbound" | "outbound";

export interface CallLog {
  id: string;
  organization_id: string;
  contact_id: string | null;
  phone_number: string;
  caller_name: string | null;
  question: string | null;
  answer: string | null;
  is_sorted: boolean;
  call_direction: CallDirection;
  call_duration: number | null;
  recording_url: string | null;
  transcription: string | null;
  ai_summary: string | null;
  created_by: string | null;
  call_date: string;
  created_at: string;
  updated_at: string;
}

export interface CallLogWithContact extends CallLog {
  contacts?: {
    id: string;
    name: string;
    phone_number: string;
  } | null;
}
