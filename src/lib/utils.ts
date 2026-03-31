import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalizes phone numbers to E.164-ish canonical form.
 * Handles UK formats: 07755… → +447755…, 00447755… → +447755…
 */
export function normalizePhone(raw: string): string {
  // Strip spaces, dashes, parens, dots
  let num = raw.replace(/[\s\-(). ]/g, "");
  if (!num) return raw;
  // 00XX → +XX
  if (num.startsWith("00")) num = "+" + num.slice(2);
  // 0X → +44X  (UK default)
  else if (num.startsWith("0")) num = "+44" + num.slice(1);
  return num;
}
