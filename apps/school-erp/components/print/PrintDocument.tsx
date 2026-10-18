"use client";

import React, { useEffect } from "react";
import { Printer, ArrowLeft } from "lucide-react";

export interface PrintDocumentProps {
  schoolName?: string;
  schoolLogoUrl?: string | null;
  schoolAddress?: string;
  docTitle: string;
  docSubtitle?: string;
  children: React.ReactNode;
}

/**
 * A4-styled printable document with the school logo at the TOP and school
 * verification footer at the BOTTOM. The toolbar (Back / Print) is hidden when printing.
 */
export const PrintDocument: React.FC<PrintDocumentProps> = ({
  schoolName = "School",
  schoolLogoUrl,
  schoolAddress,
  docTitle,
  docSubtitle,
  children,
}) => {
  useEffect(() => {
    document.title = `${schoolName} — ${docTitle}`;
  }, [schoolName, docTitle]);

  return (
    <div className="print-page-container min-h-screen bg-slate-100 print:bg-white">
      {/* Toolbar */}
      <div className="no-print print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-semibold hover:bg-[#0B7A70] transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / Save as PDF
        </button>
      </div>

      {/* A4 sheet */}
      <div className="print-sheet mx-auto my-6 print:my-0 bg-white shadow-lg print:shadow-none max-w-3xl w-full min-h-[260mm] print:min-h-0 p-6 sm:p-10 flex flex-col border border-slate-200 print:border-0">
        {/* Header — school logo top */}
        <header className="flex items-center gap-4 border-b-2 border-[#0D9488] pb-4">
          {schoolLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={schoolLogoUrl}
              alt={schoolName}
              className="w-16 h-16 object-contain rounded"
            />
          ) : (
            <div className="w-16 h-16 rounded bg-[#0D9488] text-white flex items-center justify-center text-2xl font-bold">
              {schoolName.charAt(0)}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-slate-900">{schoolName}</h1>
            {schoolAddress && (
              <p className="text-xs text-slate-500">{schoolAddress}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-sm font-bold text-[#0D9488] uppercase tracking-wide">
              {docTitle}
            </div>
            {docSubtitle && (
              <div className="text-xs text-slate-500">{docSubtitle}</div>
            )}
          </div>
        </header>

        {/* Body */}
        <main className="flex-1 py-6">{children}</main>

        {/* Footer — Official School Record */}
        <footer className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
          <span>
            Generated on {new Date().toLocaleDateString()} · Official Institutional Document
          </span>
          <span className="font-semibold text-slate-500">{schoolName}</span>
        </footer>
      </div>
    </div>
  );
};
