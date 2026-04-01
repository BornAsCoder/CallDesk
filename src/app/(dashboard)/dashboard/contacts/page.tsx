"use client";

import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useContacts, useCreateContact, useDeleteAllContacts } from "@/lib/queries/contacts";
import { ContactsTable } from "@/components/contacts/contacts-table";
import { ContactForm } from "@/components/contacts/contact-form";
import { VCFImport } from "@/components/contacts/vcf-import";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { ContactFormData } from "@/lib/validation/contact";

export default function ContactsPage() {
  const { organization } = useUser();
  const orgId = organization?.id;

  const [search, setSearch] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);

  const { data: contacts, isLoading } = useContacts(orgId, search || undefined);
  const createContact = useCreateContact(orgId);
  const deleteAllContacts = useDeleteAllContacts();

  async function handleAddContact(data: ContactFormData) {
    try {
      await createContact.mutateAsync(data);
      toast.success("Contact added");
    } catch {
      toast.error("Failed to add contact");
      throw new Error("Failed");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-muted-foreground">
            Manage your address book
          </p>
        </div>

        <div className="flex items-center gap-2">
          <VCFImport orgId={orgId} />
          {(contacts?.length ?? 0) > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete All
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete all contacts?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all {contacts?.length} contact{contacts?.length !== 1 ? "s" : ""}. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (!orgId) return;
                      deleteAllContacts.mutate(orgId, {
                        onSuccess: () => toast.success("All contacts deleted"),
                        onError: () => toast.error("Failed to delete contacts"),
                      });
                    }}
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button onClick={() => setShowAddForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Contact
          </Button>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <ContactsTable contacts={contacts || []} isLoading={isLoading} />

      <ContactForm
        open={showAddForm}
        onOpenChange={setShowAddForm}
        onSubmit={handleAddContact}
      />
    </div>
  );
}
