"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ExpandableText } from "./expandable-text";

interface InlineEditCellProps {
  value: string;
  placeholder?: string;
  onSave: (value: string) => void;
  multiline?: boolean;
  maxLength?: number;
}

export function InlineEditCell({
  value,
  placeholder = "—",
  onSave,
  multiline,
  maxLength,
}: InlineEditCellProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  function handleSave() {
    setEditing(false);
    if (editValue !== value) {
      onSave(editValue);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === "Escape") {
      setEditValue(value);
      setEditing(false);
    }
  }

  if (editing) {
    const props = {
      ref: inputRef as React.RefObject<HTMLInputElement>,
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setEditValue(e.target.value),
      onBlur: handleSave,
      onKeyDown: handleKeyDown,
      className:
        "w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring",
    };

    if (multiline) {
      return (
        <textarea
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          rows={2}
        />
      );
    }

    return <input {...props} />;
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={cn(
        "block cursor-pointer rounded px-2 py-1 text-sm hover:bg-accent",
        !value && "text-muted-foreground italic"
      )}
      title="Click to edit"
    >
      {value
        ? (maxLength ? <ExpandableText text={value} maxLength={maxLength} /> : value)
        : placeholder}
    </span>
  );
}
