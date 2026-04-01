"use client";

import { useState, useMemo } from "react";
import { useContacts } from "@/lib/queries/contacts";
import { normalizePhone } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

interface PhoneAutocompleteProps {
  orgId?: string;
  value: string;
  onChange: (phone: string, name?: string) => void;
}

export function PhoneAutocomplete({
  orgId,
  value,
  onChange,
}: PhoneAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [contactSelected, setContactSelected] = useState(false);

  // Load ALL contacts once — filter client-side to avoid PostgREST escaping issues
  const { data: allContacts } = useContacts(orgId);

  const filtered = useMemo(() => {
    if (!search || !allContacts) return allContacts ?? [];
    const q = search.toLowerCase();
    const digits = search.replace(/\D/g, "");
    const normalized = digits.length >= 2 ? normalizePhone(search) : "";
    return allContacts.filter((c) => {
      if (c.name.toLowerCase().includes(q)) return true;
      if (digits.length < 3) return false;
      // Match if normalized input is a prefix of stored number (07466 → +447466 matches +447466097730)
      // OR if raw digits appear anywhere in stored number (7730 matches +447466097730)
      const storedDigits = c.phone_number.replace(/\D/g, "");
      return c.phone_number.startsWith(normalized) || storedDigits.includes(digits);
    });
  }, [allContacts, search]);

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => {
            setContactSelected(false);
            onChange(e.target.value);
            setSearch(e.target.value);
            if (e.target.value.length >= 2) setOpen(true);
            else setOpen(false);
          }}
          placeholder="Phone number"
          onFocus={() => {
            if (!contactSelected && value.length >= 2) setOpen(true);
          }}
        />
        <PopoverTrigger className="absolute inset-0 pointer-events-none" tabIndex={-1} />
      </div>
      <PopoverContent
        className="w-[300px] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {filtered.length === 0 ? (
              <CommandEmpty>No contacts found</CommandEmpty>
            ) : (
              <CommandGroup>
                {filtered.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={`${contact.name} ${contact.phone_number}`}
                    onSelect={() => {
                      onChange(contact.phone_number, contact.name);
                      setSearch("");
                      setContactSelected(true);
                      setOpen(false);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{contact.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {contact.phone_number}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
