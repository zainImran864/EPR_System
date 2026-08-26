/**
 * Exports JSON array data to a downloadable CSV file on the client
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  columns?: { key: keyof T; label: string }[]
): void {
  if (!data || !data.length) return;

  const cols =
    columns ||
    Object.keys(data[0]).map((k) => ({
      key: k as keyof T,
      label: k,
    }));

  const headers = cols.map((c) => `"${c.label}"`).join(",");
  const rows = data.map((item) =>
    cols
      .map((c) => {
        const val = item[c.key];
        const formatted = val === undefined || val === null ? "" : String(val);
        return `"${formatted.replace(/"/g, '""')}"`;
      })
      .join(",")
  );

  const csvContent = [headers, ...rows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
