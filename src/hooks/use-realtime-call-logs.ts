"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useRealtimeCallLogs(orgId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!orgId) return;

    const supabase = createClient();
    const channel = supabase
      .channel("call-logs-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "call_logs",
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["call-logs"] });
          queryClient.invalidateQueries({ queryKey: ["call-log-stats"] });

          if (payload.eventType === "INSERT") {
            const callerName = (payload.new as { caller_name?: string }).caller_name;
            const phone = (payload.new as { phone_number?: string }).phone_number;
            toast.info("New call logged", {
              description: callerName || phone || undefined,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, queryClient]);
}
