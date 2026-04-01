"use client";

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useCallLogs, useCallLogStats, useCreateCallLog, useDeleteAllCallLogs } from "@/lib/queries/call-logs";
import { useRealtimeCallLogs } from "@/hooks/use-realtime-call-logs";
import { CallLogTable } from "@/components/dashboard/call-log-table";
import { CallLogStats } from "@/components/dashboard/call-log-stats";
import { CallLogForm } from "@/components/dashboard/call-log-form";
import { DateFilter } from "@/components/dashboard/date-filter";
import { ExportMenu } from "@/components/dashboard/export-menu";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { CallLogFormData } from "@/lib/validation/call-log";

export default function DashboardPage() {
  const { organization } = useUser();
  const orgId = organization?.id;

  const [date, setDate] = useState(new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [sortedFilter, setSortedFilter] = useState<"all" | "sorted" | "unsorted">("all");

  const { data: callLogs, isLoading } = useCallLogs(orgId, date);
  const { data: stats, isLoading: statsLoading } = useCallLogStats(orgId, date);
  const createCallLog = useCreateCallLog(orgId);
  const deleteAllCallLogs = useDeleteAllCallLogs();

  useRealtimeCallLogs(orgId);

  const allLogs = callLogs ?? [];
  const filteredLogs =
    sortedFilter === "sorted"
      ? allLogs.filter((l) => l.is_sorted)
      : sortedFilter === "unsorted"
      ? allLogs.filter((l) => !l.is_sorted)
      : allLogs;

  async function handleAddCall(data: CallLogFormData) {
    try {
      await createCallLog.mutateAsync(data);
      toast.success("Call logged");
    } catch {
      toast.error("Failed to log call");
      throw new Error("Failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Call Log</h1>
          <p className="text-sm text-muted-foreground">
            Track and manage incoming calls
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateFilter date={date} onDateChange={setDate} />
          <ExportMenu callLogs={callLogs || []} date={date} />
          {allLogs.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all calls for this day?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {allLogs.length} call log{allLogs.length !== 1 ? "s" : ""} for {date.toLocaleDateString()}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (!orgId) return;
                      deleteAllCallLogs.mutate(
                        { orgId, date },
                        {
                          onSuccess: () => toast.success("All calls deleted"),
                          onError: () => toast.error("Failed to delete calls"),
                        }
                      );
                    }}
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={() => setShowAddForm(true)} className="gap-2 sm:ml-auto">
            <Plus className="h-4 w-4" />
            Log Call
          </Button>
        </div>
      </div>

      <CallLogStats
        total={stats?.total ?? 0}
        sorted={stats?.sorted ?? 0}
        unsorted={stats?.unsorted ?? 0}
        isLoading={statsLoading}
      />

      <div className="flex items-center gap-1 rounded-lg border w-fit p-1">
        {(["all", "unsorted", "sorted"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setSortedFilter(f)}
            className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
              sortedFilter === f
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? `All (${allLogs.length})` : f === "unsorted" ? `Unsorted (${allLogs.filter((l) => !l.is_sorted).length})` : `Sorted (${allLogs.filter((l) => l.is_sorted).length})`}
          </button>
        ))}
      </div>

      <CallLogTable
        callLogs={filteredLogs}
        isLoading={isLoading}
        orgId={orgId}
      />

      <CallLogForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleAddCall}
        orgId={orgId}
      />
    </div>
  );
}
