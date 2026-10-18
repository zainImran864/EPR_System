"use client";

import React, { useEffect } from "react";

export interface ChallanData {
  school: { name: string; logoUrl?: string | null; address?: string; phone?: string; email?: string } | null;
  student: {
    name: string;
    admissionNumber: string;
    rollNumber: string;
    className?: string;
    sectionName?: string;
    [key: string]: any;
  } | null;
  bill: {
    title: string;
    heads: { name: string; amount: number }[];
    baseAmount?: number;
    lateFeeAmount?: number;
    lateFeeApplied?: number;
    isPastDue?: boolean;
    payableAfterDueDate?: number;
    totalAmount: number;
    paidAmount: number;
    issueDate: string;
    dueDate: string;
    status: string;
    _id?: string;
    id?: string;
    [key: string]: any;
  };
}

/** One A4 fee challan with school branding and late-fee due date breakdown. Page-breaks after. */
export const FeeChallanSheet: React.FC<{ data: ChallanData; lastPage?: boolean }> = ({
  data,
  lastPage,
}) => {
  const { school, student, bill } = data;
  const baseAmt = Number(bill.baseAmount ?? bill.totalAmount ?? 0);
  const lateFeeIncrement = Number(bill.lateFeeAmount ?? bill.fineAmount ?? 500);
  const isPastDue = Boolean(bill.isPastDue);
  const payableWithinDueDate = baseAmt;
  const payableAfterDueDate = Number(bill.payableAfterDueDate ?? baseAmt + lateFeeIncrement);
  const effectiveTotal = isPastDue ? payableAfterDueDate : Number(bill.totalAmount ?? baseAmt);
  const balance = Math.max(0, effectiveTotal - (bill.paidAmount || 0));

  useEffect(() => {
    document.title = `${school?.name ?? "School"} — Fee Challan`;
  }, [school?.name]);

  return (
    <div
      className="print-sheet mx-auto my-6 print:my-0 bg-white shadow-lg print:shadow-none max-w-3xl w-full min-h-[260mm] print:min-h-0 p-6 sm:p-10 flex flex-col border border-slate-200 print:border-0 avoid-break"
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
                <td className="p-2.5 border border-slate-200 text-right font-mono-data">{h.amount}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 text-xs text-slate-700">
              <td className="p-2.5 border border-slate-200 font-semibold">Payable Within Due Date ({bill.dueDate})</td>
              <td className="p-2.5 border border-slate-200 text-right font-mono-data font-semibold">
                {payableWithinDueDate}
              </td>
            </tr>
            <tr className="bg-amber-50/70 text-xs text-amber-900">
              <td className="p-2.5 border border-slate-200 font-semibold">
                Late Fee Increment (Added After Due Date)
                {isPastDue && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold uppercase">
                    Due Date Passed — Applied
                  </span>
                )}
              </td>
              <td className="p-2.5 border border-slate-200 text-right font-mono-data font-bold text-rose-600">
                +{lateFeeIncrement}
              </td>
            </tr>
            <tr className="bg-[#F0FDFA] font-bold">
              <td className="p-2.5 border border-slate-200">
                {isPastDue ? "Total Payable (Including Late Fee Increment)" : "Payable After Due Date"}
              </td>
              <td className="p-2.5 border border-slate-200 text-right text-[#0D9488] font-mono-data">
                {payableAfterDueDate}
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment summary */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-xl bg-slate-50 border border-slate-200 p-4">
          <Summary label="Within Due Date" value={String(payableWithinDueDate)} />
          <Summary label="Late Fee Increment" value={`+${lateFeeIncrement}`} highlight={isPastDue} />
          <Summary label="Paid" value={String(bill.paidAmount)} />
          <Summary label="Balance Due" value={String(balance)} highlight={balance > 0} />
        </div>

        <div className="mt-12 flex items-end justify-between text-xs text-slate-500">
          <SignLine label="Accountant" />
          <SignLine label="Received By" />
        </div>
      </main>

      <footer className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
        <span>
          Note: A late fee increment of +{lateFeeIncrement} is automatically added after the due date ({bill.dueDate}).
        </span>
        <span className="font-semibold text-slate-500">{school?.name ?? "Official School Copy"}</span>
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
