"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { callLogSchema, type CallLogFormData } from "@/lib/validation/call-log";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneAutocomplete } from "@/components/contacts/phone-autocomplete";
import { Loader2 } from "lucide-react";

interface CallLogFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CallLogFormData) => Promise<void>;
  defaultValues?: Partial<CallLogFormData>;
  isEditing?: boolean;
  orgId?: string;
}

export function CallLogForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  isEditing,
  orgId,
}: CallLogFormProps) {
  const form = useForm<CallLogFormData>({
    resolver: zodResolver(callLogSchema),
    defaultValues: {
      phone_number: "",
      caller_name: "",
      question: "",
      answer: "",
      is_sorted: false,
      call_direction: "inbound",
      ...defaultValues,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  async function onFormSubmit(data: CallLogFormData) {
    await onSubmit(data);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Call" : "Log New Call"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <PhoneAutocomplete
                orgId={orgId}
                value={watch("phone_number")}
                onChange={(phone, name) => {
                  setValue("phone_number", phone);
                  if (name) setValue("caller_name", name);
                }}
              />
              {errors.phone_number && (
                <p className="text-xs text-red-500">{errors.phone_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                {...register("caller_name")}
                placeholder="Contact name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Direction</Label>
            <Select
              value={watch("call_direction")}
              onValueChange={(v) => setValue("call_direction", v as "inbound" | "outbound")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inbound">Inbound</SelectItem>
                <SelectItem value="outbound">Outbound</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Question</Label>
            <Textarea
              {...register("question")}
              placeholder="What was the caller asking about?"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Answer</Label>
            <Textarea
              {...register("answer")}
              placeholder="What did you tell them?"
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_sorted"
              {...register("is_sorted")}
              className="h-4 w-4 rounded border-border"
            />
            <Label htmlFor="is_sorted" className="text-sm font-normal">
              Mark as sorted
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Log Call"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
