"use client";

import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
}

export function ExpandableText({ text, maxLength = 80 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= maxLength) return <span>{text}</span>;

  return (
    <span>
      {expanded ? text : text.slice(0, maxLength) + "…"}
      <button
        onClick={(e) => { e.stopPropagation(); setExpanded((v) => !v); }}
        className="ml-1 text-xs text-blue-500 hover:underline whitespace-nowrap"
      >
        {expanded ? "show less" : "show more"}
      </button>
    </span>
  );
}
