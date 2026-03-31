"use client";

import { useState } from "react";
import { useContacts } from "@/lib/queries/contacts";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
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
  const { data: contacts } = useContacts(orgId, search || undefined);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setSearch(e.target.value);
            if (e.target.value.length >= 2) setOpen(true);
          }}
          placeholder="Phone number"
          onFocus={() => {
            if (value.length >= 2) setOpen(true);
          }}
        />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Search contacts..."
            value={search}
            onValueChange={(v) => {
              setSearch(v);
              onChange(v);
            }}
          />
          <CommandList>
            <CommandEmpty>No contacts found</CommandEmpty>
            <CommandGroup>
              {contacts?.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={`${contact.name} ${contact.phone_number}`}
                  onSelect={() => {
                    onChange(contact.phone_number, contact.name);
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
