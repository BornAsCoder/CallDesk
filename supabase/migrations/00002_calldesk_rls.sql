-- ============================================================
-- Row-Level Security Policies
-- ============================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_logs ENABLE ROW LEVEL SECURITY;

-- Helper: get current user's organization_id
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ── Organizations ───────────────────────────────────────────
CREATE POLICY "Users can view own org"
  ON public.organizations FOR SELECT
  USING (id = get_user_org_id());

CREATE POLICY "Admins can update own org"
  ON public.organizations FOR UPDATE
  USING (id = get_user_org_id() AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ));

-- ── Profiles ────────────────────────────────────────────────
CREATE POLICY "Users can view org members"
  ON public.profiles FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Allow insert during signup"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- ── Contacts ────────────────────────────────────────────────
CREATE POLICY "Org members can view contacts"
  ON public.contacts FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can insert contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Org members can update contacts"
  ON public.contacts FOR UPDATE
  USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can delete contacts"
  ON public.contacts FOR DELETE
  USING (organization_id = get_user_org_id());

-- ── Call Logs ───────────────────────────────────────────────
CREATE POLICY "Org members can view call logs"
  ON public.call_logs FOR SELECT
  USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can insert call logs"
  ON public.call_logs FOR INSERT
  WITH CHECK (organization_id = get_user_org_id());

CREATE POLICY "Org members can update call logs"
  ON public.call_logs FOR UPDATE
  USING (organization_id = get_user_org_id());

CREATE POLICY "Org members can delete call logs"
  ON public.call_logs FOR DELETE
  USING (organization_id = get_user_org_id());

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_logs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;
