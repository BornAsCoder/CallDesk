export type ContactSource = "manual" | "vcf_import" | "call_log";

export interface Contact {
  id: string;
  organization_id: string;
  name: string;
  phone_number: string;
  email: string | null;
  notes: string | null;
  source: ContactSource;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
