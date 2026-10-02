"use client";

import React from "react";
import { Printer, ArrowLeft } from "lucide-react";
import { AcademiXMark } from "@/components/brand/AcademiXLogo";

export interface PrintDocumentProps {
  schoolName?: string;
  schoolLogoUrl?: string | null;
  schoolAddress?: string;
  docTitle: string;
  docSubtitle?: string;
  children: React.ReactNode;
}

/**
 * A4-styled printable document with the school logo at the TOP and the AcademiX
 * mark small at the BOTTOM. The toolbar (Back / Print) is hidden when printing.
 * Uses the browser's native print-to-PDF — reliable and dependency-free.
 */
export const PrintDocument: React.FC<PrintDocumentProps> = ({
  schoolName = "School",
  schoolLogoUrl,
  schoolAddress,
  docTitle,
  docSubtitle,
  children,
}) => {
  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      {/* Toolbar */}
      <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
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
      <div className="mx-auto my-6 print:my-0 bg-white shadow-lg print:shadow-none w-[210mm] min-h-[297mm] p-[16mm] flex flex-col">
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

        {/* Footer — AcademiX mark small at bottom */}
        <footer className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
          <span>
            Generated on {new Date().toLocaleDateString()} · This is a
            computer-generated document.
          </span>
          <span className="flex items-center gap-1.5">
            Powered by
            <AcademiXMark className="w-4 h-4" />
            <span className="font-semibold text-slate-500">AcademiX</span>
          </span>
        </footer>
      </div>

      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
};
