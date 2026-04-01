"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Contact } from "@/types/contact";
import type { ContactFormData } from "@/lib/validation/contact";

export function useContacts(orgId: string | undefined, search?: string) {
  return useQuery({
    queryKey: ["contacts", orgId, search],
    queryFn: async () => {
      const supabase = createClient();
      let query = supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", orgId!)
        .order("name", { ascending: true });

      if (search) {
        // Strip leading zero(s) so "074660977" → "74660977"
        // This matches both stored formats: "07466…" and "+447466…"
        const phoneSearch = search.replace(/^0+/, "") || search;
        query = query.or(
          `name.ilike.%${search}%,phone_number.ilike.%${phoneSearch}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!orgId,
  });
}

export function useContactByPhone(orgId: string | undefined, phone: string) {
  return useQuery({
    queryKey: ["contact-by-phone", orgId, phone],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("organization_id", orgId!)
        .eq("phone_number", phone)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as Contact | null;
    },
    enabled: !!orgId && phone.length >= 3,
  });
}

export function useCreateContact(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: ContactFormData) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from("contacts")
        .insert({
          organization_id: orgId!,
          name: formData.name,
          phone_number: formData.phone_number,
          email: formData.email || null,
          notes: formData.notes || null,
          source: "manual",
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ContactFormData> & { id: string }) => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("contacts")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useDeleteAllContacts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orgId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("contacts")
        .delete()
        .eq("organization_id", orgId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}
