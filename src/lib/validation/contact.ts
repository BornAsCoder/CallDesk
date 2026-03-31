import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone_number: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

export type ContactFormData = z.infer<typeof contactSchema>;
