-- ============================================================
-- CallDesk — Complete Database Schema
-- ============================================================

-- ── Organizations (tenants) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.organizations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug ON public.organizations(slug);

-- ── Profiles (users / team members) ─────────────────────────
CREATE TABLE IF NOT EXISTS public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  full_name       TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'agent'
    CHECK (role IN ('admin', 'agent')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_cd_profiles_org ON public.profiles(organization_id);

-- ── Contacts (address book) ─────────────────────────────────
CREATE TABLE public.contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  phone_number    TEXT NOT NULL,
  email           TEXT,
  notes           TEXT,
  source          TEXT DEFAULT 'manual'
    CHECK (source IN ('manual', 'vcf_import', 'call_log')),
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_contacts_org ON public.contacts(organization_id);
CREATE INDEX idx_contacts_phone ON public.contacts(phone_number);
CREATE INDEX idx_contacts_name ON public.contacts(name);
CREATE UNIQUE INDEX idx_contacts_org_phone ON public.contacts(organization_id, phone_number);

-- ── Call Logs ───────────────────────────────────────────────
CREATE TABLE public.call_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id      UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  phone_number    TEXT NOT NULL,
  caller_name     TEXT,
  question        TEXT,
  answer          TEXT,
  is_sorted       BOOLEAN NOT NULL DEFAULT false,
  call_direction  TEXT DEFAULT 'inbound'
    CHECK (call_direction IN ('inbound', 'outbound')),
  call_duration   INTEGER,
  recording_url   TEXT,
  transcription   TEXT,
  ai_summary      TEXT,
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  call_date       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_logs_org ON public.call_logs(organization_id);
CREATE INDEX idx_call_logs_contact ON public.call_logs(contact_id);
CREATE INDEX idx_call_logs_phone ON public.call_logs(phone_number);
CREATE INDEX idx_call_logs_date ON public.call_logs(call_date DESC);
CREATE INDEX idx_call_logs_sorted ON public.call_logs(organization_id, is_sorted);

-- ── Updated_at triggers ─────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.call_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Auto-match contact on call log insert ───────────────────
CREATE OR REPLACE FUNCTION auto_match_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NULL AND NEW.phone_number IS NOT NULL THEN
    SELECT id, name INTO NEW.contact_id, NEW.caller_name
    FROM public.contacts
    WHERE organization_id = NEW.organization_id
      AND phone_number = NEW.phone_number
    LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER match_contact_on_insert
  BEFORE INSERT ON public.call_logs
  FOR EACH ROW
  EXECUTE FUNCTION auto_match_contact();
