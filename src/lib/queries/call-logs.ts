"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { CallLogWithContact } from "@/types/call-log";
import type { CallLogFormData } from "@/lib/validation/call-log";
import { startOfDay, endOfDay } from "date-fns";
import { normalizePhone } from "@/lib/utils";

export function useCallLogs(orgId: string | undefined, date: Date) {
  return useQuery({
    queryKey: ["call-logs", orgId, date.toISOString().split("T")[0]],
    queryFn: async () => {
      const supabase = createClient();
      const dayStart = startOfDay(date).toISOString();
      const dayEnd = endOfDay(date).toISOString();

      const { data, error } = await supabase
        .from("call_logs")
        .select("*, contacts(id, name, phone_number)")
        .eq("organization_id", orgId!)
        .gte("call_date", dayStart)
        .lt("call_date", dayEnd)
        .order("call_date", { ascending: false });

      if (error) throw error;
      return data as CallLogWithContact[];
    },
    enabled: !!orgId,
  });
}

export function useCallLogStats(orgId: string | undefined, date: Date) {
  return useQuery({
    queryKey: ["call-log-stats", orgId, date.toISOString().split("T")[0]],
    queryFn: async () => {
      const supabase = createClient();
      const dayStart = startOfDay(date).toISOString();
      const dayEnd = endOfDay(date).toISOString();

      const { data, error } = await supabase
        .from("call_logs")
        .select("id, is_sorted")
        .eq("organization_id", orgId!)
        .gte("call_date", dayStart)
        .lt("call_date", dayEnd);

      if (error) throw error;

      const total = data.length;
      const sorted = data.filter((d) => d.is_sorted).length;
      const unsorted = total - sorted;

      return { total, sorted, unsorted };
    },
    enabled: !!orgId,
  });
}

export function useCreateCallLog(orgId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: CallLogFormData) => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      // Auto-create contact if name given and no contact exists for this number
      let contactId: string | null = null;
      const normalizedPhone = normalizePhone(formData.phone_number);
      if (formData.caller_name?.trim()) {
        const { data: existing } = await supabase
          .from("contacts")
          .select("id")
          .eq("organization_id", orgId!)
          .eq("phone_number", normalizedPhone)
          .single();

        if (existing) {
          contactId = existing.id;
        } else {
          const { data: created } = await supabase
            .from("contacts")
            .insert({
              organization_id: orgId!,
              name: formData.caller_name.trim(),
              phone_number: normalizedPhone,
              source: "call_log",
              created_by: user?.id,
            })
            .select("id")
            .single();
          if (created) contactId = created.id;
        }
      }

      const { data, error } = await supabase
        .from("call_logs")
        .insert({
          organization_id: orgId!,
          phone_number: normalizedPhone,
          contact_id: contactId,
          caller_name: formData.caller_name || null,
          question: formData.question || null,
          answer: formData.answer || null,
          is_sorted: formData.is_sorted,
          call_direction: formData.call_direction,
          call_date: formData.call_date || new Date().toISOString(),
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Fire Telegram notification (non-blocking, best-effort)
      fetch("/api/notify/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: data.phone_number,
          caller_name: data.caller_name,
          question: data.question,
          answer: data.answer,
          call_direction: data.call_direction,
        }),
      }).catch(() => {});

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-logs"] });
      queryClient.invalidateQueries({ queryKey: ["call-log-stats"] });
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
    },
  });
}

export function useUpdateCallLog(orgId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CallLogFormData> & { id: string }) => {
      const supabase = createClient();

      // If caller_name is being set, auto-create/link contact
      if (orgId && updates.caller_name?.trim()) {
        const { data: { user } } = await supabase.auth.getUser();

        // Fetch this log's phone number
        const { data: log } = await supabase
          .from("call_logs")
          .select("phone_number, contact_id")
          .eq("id", id)
          .single();

        if (log && !log.contact_id) {
          const normalizedPhone = normalizePhone(log.phone_number);
          const { data: existing } = await supabase
            .from("contacts")
            .select("id")
            .eq("organization_id", orgId)
            .eq("phone_number", normalizedPhone)
            .single();

          if (existing) {
            (updates as Record<string, unknown>).contact_id = existing.id;
          } else {
            const { data: created } = await supabase
              .from("contacts")
              .insert({
                organization_id: orgId,
                name: updates.caller_name.trim(),
                phone_number: normalizedPhone,
                source: "call_log",
                created_by: user?.id,
              })
              .select("id")
              .single();
            if (created) {
              (updates as Record<string, unknown>).contact_id = created.id;
              queryClient.invalidateQueries({ queryKey: ["contacts"] });
            }
          }
        }
      }

      const { data, error } = await supabase
        .from("call_logs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-logs"] });
      queryClient.invalidateQueries({ queryKey: ["call-log-stats"] });
    },
  });
}

export function useDeleteCallLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("call_logs")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["call-logs"] });
      queryClient.invalidateQueries({ queryKey: ["call-log-stats"] });
    },
  });
}
