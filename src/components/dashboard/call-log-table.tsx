"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, PhoneIncoming, PhoneOutgoing, Copy } from "lucide-react";
import type { CallLogWithContact } from "@/types/call-log";
import { useUpdateCallLog, useDeleteCallLog } from "@/lib/queries/call-logs";
import { CallLogForm } from "./call-log-form";
import { InlineEditCell } from "./inline-edit-cell";
import { toast } from "sonner";

interface CallLogTableProps {
  callLogs: CallLogWithContact[];
  isLoading: boolean;
  orgId?: string;
}

export function CallLogTable({ callLogs, isLoading, orgId }: CallLogTableProps) {
  const updateCallLog = useUpdateCallLog(orgId);
  const deleteCallLog = useDeleteCallLog();
  const [editingLog, setEditingLog] = useState<CallLogWithContact | null>(null);

  function handleSortedToggle(id: string, checked: boolean) {
    updateCallLog.mutate(
      { id, is_sorted: checked },
      {
        onError: () => toast.error("Failed to update"),
      }
    );
  }

  function handleInlineUpdate(id: string, field: string, value: string) {
    updateCallLog.mutate(
      { id, [field]: value || null },
      {
        onError: () => toast.error("Failed to update"),
      }
    );
  }

  function handleDelete(id: string) {
    deleteCallLog.mutate(id, {
      onSuccess: () => toast.success("Call log deleted"),
      onError: () => toast.error("Failed to delete"),
    });
  }

  function handleCopy(log: CallLogWithContact) {
    const parts = [
      `Phone: ${log.phone_number}`,
      log.caller_name ? `Name: ${log.caller_name}` : null,
      log.question ? `Question: ${log.question}` : null,
      log.answer ? `Answer: ${log.answer}` : null,
    ].filter(Boolean);
    navigator.clipboard.writeText(parts.join("\n"));
    toast.success("Copied to clipboard");
  }

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (callLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No calls logged for this day</p>
        <p className="text-sm text-muted-foreground">
          Click &quot;Log Call&quot; to add an entry
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Mobile card list (< md) ───────────────────────────── */}
      <div className="flex flex-col gap-2 md:hidden">
        {callLogs.map((log) => (
          <div
            key={log.id}
            className={[
              "rounded-lg border p-3 space-y-2",
              log.is_sorted ? "opacity-60" : "",
            ].join(" ")}
          >
            {/* Top row: icon + number + name + actions */}
            <div className="flex items-center gap-2">
              {log.call_direction === "inbound" ? (
                <PhoneIncoming className="h-4 w-4 shrink-0 text-blue-500" />
              ) : (
                <PhoneOutgoing className="h-4 w-4 shrink-0 text-green-500" />
              )}
              <a
                href={`tel:${log.phone_number}`}
                className="font-mono text-sm font-medium hover:underline hover:text-blue-600 transition-colors"
              >
                {log.phone_number}
              </a>
              {log.caller_name && (
                <span className="text-sm text-muted-foreground truncate">· {log.caller_name}</span>
              )}
              <div className="ml-auto flex items-center gap-2">
                <Checkbox
                  className="size-6"
                  checked={log.is_sorted}
                  onCheckedChange={(checked) => handleSortedToggle(log.id, checked as boolean)}
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleCopy(log)}>
                      <Copy className="mr-2 h-4 w-4" />Copy
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEditingLog(log)}>
                      <Pencil className="mr-2 h-4 w-4" />Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(log.id)}>
                      <Trash2 className="mr-2 h-4 w-4" />Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Question / Answer inline edit */}
            {(log.question || log.answer) && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {log.question && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Question</p>
                    <InlineEditCell
                      value={log.question}
                      placeholder="—"
                      onSave={(v) => handleInlineUpdate(log.id, "question", v)}
                      multiline
                      maxLength={100}
                    />
                  </div>
                )}
                {log.answer && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-0.5">Answer</p>
                    <InlineEditCell
                      value={log.answer}
                      placeholder="—"
                      onSave={(v) => handleInlineUpdate(log.id, "answer", v)}
                      multiline
                      maxLength={100}
                    />
                  </div>
                )}
              </div>
            )}
            {!log.question && !log.answer && (
              <p className="text-xs text-muted-foreground italic">No question/answer — tap Edit to add</p>
            )}
          </div>
        ))}
      </div>

      {/* ── Desktop table (≥ md) ──────────────────────────────── */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="divide-x divide-border">
              <TableHead className="w-10"></TableHead>
              <TableHead className="w-[140px]">Number</TableHead>
              <TableHead className="w-[160px]">Name</TableHead>
              <TableHead className="min-w-[180px]">Question</TableHead>
              <TableHead className="min-w-[180px]">Answer</TableHead>
              <TableHead className="w-[80px] text-center">Sorted</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {callLogs.map((log, i) => (
              <TableRow
                key={log.id}
                className={[
                  "divide-x divide-border",
                  i % 2 === 0 ? "bg-background" : "bg-muted/40",
                  log.is_sorted ? "opacity-60" : "",
                ].join(" ")}
              >
                <TableCell className="px-3">
                  {log.call_direction === "inbound" ? (
                    <PhoneIncoming className="h-4 w-4 text-blue-500" />
                  ) : (
                    <PhoneOutgoing className="h-4 w-4 text-green-500" />
                  )}
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <a
                    href={`tel:${log.phone_number}`}
                    className="hover:underline hover:text-blue-600 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {log.phone_number}
                  </a>
                </TableCell>
                <TableCell>
                  <InlineEditCell
                    value={log.caller_name || ""}
                    placeholder="—"
                    onSave={(value) => handleInlineUpdate(log.id, "caller_name", value)}
                  />
                </TableCell>
                <TableCell className="whitespace-normal break-words max-w-[280px]">
                  <InlineEditCell
                    value={log.question || ""}
                    placeholder="Click to add question..."
                    onSave={(value) => handleInlineUpdate(log.id, "question", value)}
                    multiline
                    maxLength={100}
                  />
                </TableCell>
                <TableCell className="whitespace-normal break-words max-w-[280px]">
                  <InlineEditCell
                    value={log.answer || ""}
                    placeholder="Click to add answer..."
                    onSave={(value) => handleInlineUpdate(log.id, "answer", value)}
                    multiline
                    maxLength={100}
                  />
                </TableCell>
                <TableCell className="text-center">
                  <Checkbox
                    className="size-6"
                    checked={log.is_sorted}
                    onCheckedChange={(checked) =>
                      handleSortedToggle(log.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleCopy(log)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingLog(log)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(log.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {editingLog && (
        <CallLogForm
          open={!!editingLog}
          onOpenChange={(open) => !open && setEditingLog(null)}
          orgId={orgId}
          isEditing
          defaultValues={{
            phone_number: editingLog.phone_number,
            caller_name: editingLog.caller_name || "",
            question: editingLog.question || "",
            answer: editingLog.answer || "",
            is_sorted: editingLog.is_sorted,
            call_direction: editingLog.call_direction,
          }}
          onSubmit={async (data) => {
            await updateCallLog.mutateAsync({ id: editingLog.id, ...data });
            setEditingLog(null);
          }}
        />
      )}
    </>
  );
}
