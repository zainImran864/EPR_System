"use client";

import React from "react";
import { AcademiXMark } from "@/components/brand/AcademiXLogo";

export interface ChallanData {
  school: { name: string; logoUrl?: string | null; address?: string } | null;
  student: {
    name: string;
    admissionNumber: string;
    rollNumber: string;
    className?: string;
    sectionName?: string;
  } | null;
  bill: {
    title: string;
    heads: { name: string; amount: number }[];
    totalAmount: number;
    paidAmount: number;
    issueDate: string;
    dueDate: string;
    status: string;
  };
}

/** One A4 fee challan (school logo top, AcademiX text bottom). Page-breaks after. */
export const FeeChallanSheet: React.FC<{ data: ChallanData; lastPage?: boolean }> = ({
  data,
  lastPage,
}) => {
  const { school, student, bill } = data;
  const balance = bill.totalAmount - bill.paidAmount;

  return (
    <div
      className="mx-auto my-6 print:my-0 bg-white shadow-lg print:shadow-none w-[210mm] min-h-[297mm] p-[16mm] flex flex-col"
      style={{ pageBreakAfter: lastPage ? "auto" : "always" }}
    >
      {/* Header */}
      <header className="flex items-center gap-4 border-b-2 border-[#0D9488] pb-4">
        {school?.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={school.logoUrl} alt={school.name} className="w-16 h-16 object-contain rounded" />
        ) : (
          <div className="w-16 h-16 rounded bg-[#0D9488] text-white flex items-center justify-center text-2xl font-bold">
            {(school?.name ?? "S").charAt(0)}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900">{school?.name ?? "School"}</h1>
          {school?.address && <p className="text-xs text-slate-500">{school.address}</p>}
        </div>
        <div className="text-right">
          <div className="text-sm font-bold text-[#0D9488] uppercase tracking-wide">Fee Challan</div>
          <div className="text-xs text-slate-500">{bill.title}</div>
        </div>
      </header>

      <main className="flex-1 py-6">
        {/* Student info */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm mb-6">
          <Info label="Student" value={student?.name ?? ""} />
          <Info label="Admission No" value={student?.admissionNumber ?? ""} />
          <Info label="Class" value={`${student?.className ?? ""} ${student?.sectionName ?? ""}`} />
          <Info label="Roll No" value={student?.rollNumber ?? ""} />
          <Info label="Issue Date" value={bill.issueDate} />
          <Info label="Due Date" value={bill.dueDate} />
        </div>

        {/* Heads */}
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="text-left p-2.5 border border-slate-200 font-semibold">Fee Head</th>
              <th className="text-right p-2.5 border border-slate-200 font-semibold w-40">Amount</th>
            </tr>
          </thead>
          <tbody>
            {bill.heads.map((h, i) => (
              <tr key={i}>
                <td className="p-2.5 border border-slate-200">{h.name}</td>
                <td className="p-2.5 border border-slate-200 text-right">{h.amount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-[#F0FDFA] font-bold">
              <td className="p-2.5 border border-slate-200">Total Payable</td>
              <td className="p-2.5 border border-slate-200 text-right text-[#0D9488]">
                {bill.totalAmount}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment summary */}
        <div className="mt-6 flex items-center justify-between rounded-xl bg-slate-50 border border-slate-200 p-4">
          <Summary label="Paid" value={String(bill.paidAmount)} />
          <Summary label="Balance" value={String(balance)} highlight={balance > 0} />
          <Summary label="Status" value={bill.status.toUpperCase()} />
        </div>

        <div className="mt-16 flex items-end justify-between text-xs text-slate-500">
          <SignLine label="Accountant" />
          <SignLine label="Received By" />
        </div>
      </main>

      <footer className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>Please pay before the due date to avoid late charges.</span>
        <span className="flex items-center gap-1.5">
          Powered by
          <AcademiXMark className="w-4 h-4" />
          <span className="font-semibold text-slate-500">AcademiX</span>
        </span>
      </footer>
    </div>
  );
};

const Info: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="text-slate-400 w-28 shrink-0">{label}:</span>
    <span className="font-medium text-slate-800">{value}</span>
  </div>
);

const Summary: React.FC<{ label: string; value: string; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <div className="text-center">
    <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    <div className={`text-lg font-bold ${highlight ? "text-rose-600" : "text-slate-900"}`}>
      {value}
    </div>
  </div>
);

const SignLine: React.FC<{ label: string }> = ({ label }) => (
  <div className="text-center">
    <div className="w-32 border-t border-slate-400 mb-1" />
    {label}
  </div>
);
