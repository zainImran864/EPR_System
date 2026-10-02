import React from "react";

/**
 * KeyDown event handler that blocks negative sign ('-'), exponent ('e', 'E'),
 * and plus sign ('+') from being typed into positive numeric fields.
 */
export function preventNegativeKey(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
    e.preventDefault();
  }
}

/**
 * Sanitizes a numeric string or number to ensure it is non-negative.
 * Strips out negative signs, exponential notation, and invalid characters.
 */
export function sanitizePositiveNumber(
  value: string | number | undefined | null,
  allowDecimal: boolean = false
): string {
  if (value === undefined || value === null || value === "") return "";
  const str = String(value);

  // Remove any minus, plus, e/E symbols
  let cleaned = str.replace(/[-+eE]/g, "");

  if (!allowDecimal) {
    cleaned = cleaned.replace(/[^0-9]/g, "");
  } else {
    // Keep only digits and at most one decimal point
    const parts = cleaned.split(".");
    if (parts.length > 2) {
      cleaned = parts[0] + "." + parts.slice(1).join("");
    }
  }

  // Ensure value is non-negative
  if (cleaned !== "" && !isNaN(Number(cleaned))) {
    const num = Number(cleaned);
    if (num < 0) return "0";
  }

  return cleaned;
}

/**
 * Clipboard paste handler that cleans pasted text to guarantee only positive digits.
 */
export function preventNegativePaste(
  e: React.ClipboardEvent<HTMLInputElement>,
  allowDecimal: boolean = false
) {
  const pasteData = e.clipboardData.getData("text");
  if (/[-+eE]/.test(pasteData) || (!allowDecimal && /\./.test(pasteData))) {
    e.preventDefault();
    const sanitized = sanitizePositiveNumber(pasteData, allowDecimal);
    document.execCommand("insertText", false, sanitized);
  }
}
