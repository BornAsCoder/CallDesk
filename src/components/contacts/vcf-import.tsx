"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface ParsedContact {
  name: string;
  phone_number: string;
  email: string;
  selected: boolean;
}

function parseVCF(text: string): ParsedContact[] {
  const contacts: ParsedContact[] = [];
  const vcards = text.split("BEGIN:VCARD");

  for (const vcard of vcards) {
    if (!vcard.trim()) continue;

    let name = "";
    let phone = "";
    let email = "";

    const lines = vcard.split(/\r?\n/);
    for (const line of lines) {
      if (line.startsWith("FN:") || line.startsWith("FN;")) {
        name = line.replace(/^FN[;:].*?:?/, "").replace(/^FN:/, "").trim();
        if (!name) {
          const match = line.match(/FN[^:]*:(.*)/);
          if (match) name = match[1].trim();
        }
      }
      if ((line.startsWith("TEL") || line.startsWith("tel")) && !phone) {
        const match = line.match(/:([\d\s+\-().]+)/);
        if (match) phone = match[1].replace(/[\s\-().]/g, "").trim();
      }
      if ((line.startsWith("EMAIL") || line.startsWith("email")) && !email) {
        const match = line.match(/:(.*)/);
        if (match) email = match[1].trim();
      }
    }

    if (name && phone) {
      contacts.push({ name, phone_number: phone, email, selected: true });
    }
  }

  return contacts;
}

interface VCFImportProps {
  orgId?: string;
}

export function VCFImport({ orgId }: VCFImportProps) {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState<ParsedContact[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseVCF(text);
      if (parsed.length === 0) {
        toast.error("No valid contacts found in the file");
        return;
      }
      setContacts(parsed);
      setOpen(true);
    };
    reader.readAsText(file);

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function toggleContact(index: number) {
    setContacts((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, selected: !c.selected } : c
      )
    );
  }

  function toggleAll() {
    const allSelected = contacts.every((c) => c.selected);
    setContacts((prev) => prev.map((c) => ({ ...c, selected: !allSelected })));
  }

  async function handleImport() {
    const selected = contacts.filter((c) => c.selected);
    if (selected.length === 0) {
      toast.error("No contacts selected");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contacts: selected.map((c) => ({
            name: c.name,
            phone_number: c.phone_number,
            email: c.email || null,
          })),
        }),
      });

      if (!res.ok) throw new Error();

      const result = await res.json();
      toast.success(`Imported ${result.count} contacts`);
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setOpen(false);
      setContacts([]);
    } catch {
      toast.error("Failed to import contacts");
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-2"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="h-4 w-4" />
        Import VCF
      </Button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".vcf"
        className="hidden"
        onChange={handleFileSelect}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Contacts</DialogTitle>
            <DialogDescription>
              {contacts.length} contacts found. Select which ones to import.
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center gap-2 border-b pb-2">
            <Checkbox
              checked={contacts.every((c) => c.selected)}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm font-medium">Select All</span>
            <span className="ml-auto text-sm text-muted-foreground">
              {contacts.filter((c) => c.selected).length} selected
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1">
            {contacts.map((contact, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-md p-2 hover:bg-accent"
              >
                <Checkbox
                  checked={contact.selected}
                  onCheckedChange={() => toggleContact(i)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{contact.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {contact.phone_number}
                    {contact.email ? ` | ${contact.email}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 border-t pt-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={importing}>
              {importing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing...
                </>
              ) : (
                `Import ${contacts.filter((c) => c.selected).length} Contacts`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
