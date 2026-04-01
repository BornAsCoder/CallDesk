import { z } from "zod";

export const callLogSchema = z.object({
  phone_number: z.string().min(1, "Phone number is required"),
  caller_name: z.string().optional().or(z.literal("")),
  question: z.string().optional().or(z.literal("")),
  answer: z.string().optional().or(z.literal("")),
  is_sorted: z.boolean().default(false),
  call_direction: z.enum(["inbound", "outbound"]).default("inbound"),
  call_date: z.string().optional(),
  recording_url: z.string().optional().or(z.literal("")),
  transcription: z.string().optional().or(z.literal("")),
});

export type CallLogFormData = z.input<typeof callLogSchema>;
