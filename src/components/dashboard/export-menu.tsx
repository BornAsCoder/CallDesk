"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, Mail, Copy } from "lucide-react";
import type { CallLogWithContact } from "@/types/call-log";
import { format } from "date-fns";
import { toast } from "sonner";

interface ExportMenuProps {
  callLogs: CallLogWithContact[];
  date: Date;
}

export function ExportMenu({ callLogs, date }: ExportMenuProps) {
  function exportCSV() {
    const headers = ["Number", "Name", "Question", "Answer", "Sorted", "Direction"];
    const rows = callLogs.map((log) => [
      log.phone_number,
      log.caller_name || "",
      (log.question || "").replace(/"/g, '""'),
      (log.answer || "").replace(/"/g, '""'),
      log.is_sorted ? "Yes" : "No",
      log.call_direction,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((r) => r.map((c) => `"${c}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `call-log-${format(date, "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  }

  function copyToClipboard() {
    const text = callLogs
      .map(
        (log) =>
          `${log.phone_number} | ${log.caller_name || "Unknown"} | Q: ${log.question || "—"} | A: ${log.answer || "—"} | ${log.is_sorted ? "Sorted" : "Unsorted"}`
      )
      .join("\n");

    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  async function sendEmail() {
    try {
      const res = await fetch("/api/call-logs/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: date.toISOString() }),
      });

      if (!res.ok) throw new Error();
      toast.success("Email sent successfully");
    } catch {
      toast.error("Failed to send email");
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportCSV}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={copyToClipboard}>
          <Copy className="mr-2 h-4 w-4" />
          Copy to Clipboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={sendEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Email Day&apos;s Log
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
