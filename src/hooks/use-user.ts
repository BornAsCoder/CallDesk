"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/profile";
import type { Organization } from "@/types/organization";

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    if (profileData) setProfile(profileData);
  }, [user]);

  const refreshOrganization = useCallback(async () => {
    if (!profile?.organization_id) return;
    const supabase = createClient();
    const { data: orgData } = await supabase
      .from("organizations")
      .select("*")
      .eq("id", profile.organization_id)
      .single();
    if (orgData) setOrganization(orgData);
  }, [profile?.organization_id]);

  useEffect(() => {
    const supabase = createClient();

    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(profileData);

        if (profileData) {
          const { data: orgData } = await supabase
            .from("organizations")
            .select("*")
            .eq("id", profileData.organization_id)
            .single();
          setOrganization(orgData);
        }
      }

      setLoading(false);
    }

    loadUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (!session?.user) {
          setProfile(null);
          setOrganization(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, profile, organization, loading, refreshProfile, refreshOrganization };
}
