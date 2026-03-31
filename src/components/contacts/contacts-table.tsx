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
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Contact } from "@/types/contact";
import { useUpdateContact, useDeleteContact } from "@/lib/queries/contacts";
import { ContactForm } from "./contact-form";
import { toast } from "sonner";
import type { ContactFormData } from "@/lib/validation/contact";

interface ContactsTableProps {
  contacts: Contact[];
  isLoading: boolean;
}

export function ContactsTable({ contacts, isLoading }: ContactsTableProps) {
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  function handleDelete(id: string) {
    deleteContact.mutate(id, {
      onSuccess: () => toast.success("Contact deleted"),
      onError: () => toast.error("Failed to delete contact"),
    });
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

  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-muted-foreground">No contacts yet</p>
        <p className="text-sm text-muted-foreground">
          Add contacts manually or import from a .vcf file
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead className="w-[80px]">Source</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell className="font-medium">{contact.name}</TableCell>
                <TableCell className="font-mono text-sm">
                  {contact.phone_number}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {contact.email || "—"}
                </TableCell>
                <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                  {contact.notes || "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {contact.source === "vcf_import" ? "Import" : "Manual"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setEditingContact(contact)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(contact.id)}
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

      {editingContact && (
        <ContactForm
          open={!!editingContact}
          onOpenChange={(open) => !open && setEditingContact(null)}
          isEditing
          defaultValues={{
            name: editingContact.name,
            phone_number: editingContact.phone_number,
            email: editingContact.email || "",
            notes: editingContact.notes || "",
          }}
          onSubmit={async (data: ContactFormData) => {
            await updateContact.mutateAsync({
              id: editingContact.id,
              ...data,
            });
            setEditingContact(null);
            toast.success("Contact updated");
          }}
        />
      )}
    </>
  );
}
