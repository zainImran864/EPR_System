/**
 * Formats a date string (YYYY-MM-DD) into a human readable format
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return dateString;
  }
}

/**
 * Calculates academic grade based on percentage score
 */
export function getGradeFromScore(obtained: number, total: number = 100): string {
  if (total <= 0) return "F";
  const pct = (obtained / total) * 100;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

/**
 * Formats fee amounts in USD or local currency
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}
