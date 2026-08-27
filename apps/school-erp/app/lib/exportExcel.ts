import ExcelJS from "exceljs";

export interface ExcelColumn<T> {
  key: keyof T;
  label: string;
  width?: number;
}

export interface ExcelBranding {
  schoolName: string;
  schoolCode?: string;
  address?: string;
  logoUrl?: string | null;
  /** Report title, e.g. "Student Directory". */
  title: string;
}

const TEAL = "FF0D9488";
const TEAL_DARK = "FF115E59";
const TEAL_LIGHT = "FFF0FDFA";
const ZEBRA = "FFF8FAFC";
const SLATE = "FF475569";
const BORDER = "FFE2E8F0";

function thin(color = BORDER): Partial<ExcelJS.Borders> {
  const side = { style: "thin" as const, color: { argb: color } };
  return { top: side, left: side, bottom: side, right: side };
}

async function tryLoadLogo(
  wb: ExcelJS.Workbook,
  logoUrl?: string | null
): Promise<number | null> {
  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl);
    if (!res.ok) return null;
    const type = res.headers.get("content-type") || "";
    const ext = type.includes("png")
      ? "png"
      : type.includes("jpeg") || type.includes("jpg")
      ? "jpeg"
      : type.includes("gif")
      ? "gif"
      : null;
    if (!ext) return null;
    const buffer = await res.arrayBuffer();
    return wb.addImage({ buffer, extension: ext as "png" | "jpeg" | "gif" });
  } catch {
    return null;
  }
}

/**
 * Export rows to a designed .xlsx — school branding banner on top, a formatted
 * table, and a "Made with AcademiX" footer. Runs entirely client-side.
 */
export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ExcelColumn<T>[],
  filename: string,
  branding: ExcelBranding
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "AcademiX";
  wb.created = new Date();

  const ws = wb.addWorksheet(branding.title.slice(0, 28) || "Report", {
    views: [{ state: "frozen", ySplit: 5 }],
    properties: { defaultRowHeight: 18 },
  });

  const n = columns.length;
  const lastCol = String.fromCharCode(64 + n); // works for up to 26 cols

  // Column widths
  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width ?? 22;
  });

  // ── Branding banner (rows 1–3) ──
  ws.mergeCells(`A1:${lastCol}1`);
  const r1 = ws.getCell("A1");
  r1.value = branding.schoolName;
  r1.font = { name: "Calibri", size: 18, bold: true, color: { argb: TEAL } };
  r1.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(1).height = 30;

  ws.mergeCells(`A2:${lastCol}2`);
  const r2 = ws.getCell("A2");
  r2.value = [branding.schoolCode, branding.address].filter(Boolean).join("  ·  ");
  r2.font = { size: 10, italic: true, color: { argb: SLATE } };
  r2.alignment = { vertical: "middle", horizontal: "center" };

  ws.mergeCells(`A3:${lastCol}3`);
  const r3 = ws.getCell("A3");
  const dateStr = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  r3.value = `${branding.title}    —    Generated ${dateStr}`;
  r3.font = { size: 11, bold: true, color: { argb: TEAL_DARK } };
  r3.alignment = { vertical: "middle", horizontal: "center" };
  r3.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL_LIGHT } };
  ws.getRow(3).height = 22;

  // Row 4 spacer
  ws.getRow(4).height = 6;

  // Optional logo floated at top-left
  const logoId = await tryLoadLogo(wb, branding.logoUrl);
  if (logoId != null) {
    ws.addImage(logoId, {
      tl: { col: 0.15, row: 0.15 } as ExcelJS.Anchor,
      ext: { width: 74, height: 74 },
    });
  }

  // ── Header row (row 5) ──
  const headerRow = ws.getRow(5);
  columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = c.label;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: TEAL } };
    cell.alignment = { vertical: "middle", horizontal: "center", wrapText: true };
    cell.border = thin(TEAL_DARK);
  });
  headerRow.height = 22;

  // ── Data rows ──
  data.forEach((item, idx) => {
    const row = ws.getRow(6 + idx);
    columns.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const val = item[c.key];
      cell.value = val === undefined || val === null ? "" : (val as ExcelJS.CellValue);
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
      cell.border = thin();
      cell.font = { size: 10, color: { argb: "FF0F172A" } };
      if (idx % 2 === 1) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
      }
    });
  });

  // ── Footer ──
  const footerRowNum = 6 + data.length + 1;
  ws.mergeCells(`A${footerRowNum}:${lastCol}${footerRowNum}`);
  const footer = ws.getCell(`A${footerRowNum}`);
  footer.value = "Made with AcademiX  —  School Management Platform";
  footer.font = { size: 10, italic: true, color: { argb: SLATE } };
  footer.alignment = { vertical: "middle", horizontal: "center" };
  ws.getRow(footerRowNum).height = 20;

  // ── Download ──
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
