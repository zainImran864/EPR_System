"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Receipt, Users, CheckCircle2 } from "lucide-react";
import { expensesRestApi, apiClient } from "@/app/api/client";
import { useActiveSchool } from "@/app/hooks/useActiveSchool";
import { Spinner } from "@/components/ui/Spinner";

function Toolbar() {
  const handleBack = () => {
    if (window.opener) {
      window.close();
      return;
    }
    if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      window.location.href = "/admin/expenses";
    }
  };

  return (
    <div className="no-print print:hidden sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Expenses
      </button>
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium">Ready for Official Auditing &amp; Archiving</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print Financial Report / PDF
        </button>
      </div>
    </div>
  );
}

function FinancialReportContent() {
  const { school } = useActiveSchool();
  const searchParams = useSearchParams();

  const rangeType = searchParams.get("rangeType") || "monthly";
  const month = searchParams.get("month") || "October 2026";
  const year = searchParams.get("year") || "2026-2027";
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<any>("/expenses/tracking", { rangeType, month, year, startDate, endDate })
      .then((res: any) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [rangeType, month, year, startDate, endDate]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-2">
        <Spinner size="lg" />
        <p className="text-xs text-slate-500">Generating formal financial report…</p>
      </div>
    );
  }

  const summary = data?.summary || {
    totalFeesBilled: 0,
    totalFeesCollected: 0,
    totalFeesPending: 0,
    totalExpenses: 0,
    netProfitLoss: 0,
    isProfitable: true,
    profitMarginPercent: 0,
  };

  const isProfit = summary.netProfitLoss >= 0;
  const categories = data?.categoryBreakdown || [];
  const expenses = data?.recentExpenses || [];
  const currency = school?.currencySymbol || (typeof window !== "undefined" ? localStorage.getItem("erp_school_currency_symbol") : null) || "$";

  return (
    <div className="max-w-[900px] mx-auto my-6 p-8 bg-white border border-slate-200 shadow-sm rounded-xl print:m-0 print:p-6 print:border-none print:shadow-none print:max-w-none">
      {/* Formal Institutional Header */}
      <div className="border-b-2 border-slate-900 pb-5 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              {school?.name || "Oakridge International School"}
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              {school?.address || "742 Evergreen Terrace, Springfield"} • Tel: {school?.phone || "+1 (555) 234-5678"}
            </p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              School Code: {school?.code || "OAK-RIDGE"} • Reg. Academic Session: {school?.activeYear || "2026-2027"}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-bold tracking-wider uppercase text-slate-800">
              STATEMENT OF ACCOUNTS
            </span>
            <p className="text-xs text-slate-500 font-mono mt-2">
              Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              Period: {data?.periodLabel || month}
            </p>
          </div>
        </div>
      </div>

      {/* Core Executive Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Fee Collections (Earned)</div>
          <div className="text-lg font-black text-emerald-700 font-mono mt-1">
            +{currency} {Number(summary.totalFeesCollected).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Billed: {currency} {Number(summary.totalFeesBilled).toLocaleString()}
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Expenses (Spent)</div>
          <div className="text-lg font-black text-rose-700 font-mono mt-1">
            -{currency} {Number(summary.totalExpenses).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            {expenses.length} Vouchers Cleared
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Net Operating Balance</div>
          <div className={`text-lg font-black font-mono mt-1 ${isProfit ? "text-emerald-700" : "text-rose-700"}`}>
            {isProfit ? "+" : "-"}{currency} {Math.abs(summary.netProfitLoss).toLocaleString()}
          </div>
          <div className="text-[10px] font-bold mt-0.5 text-slate-600">
            {isProfit ? "Operational Surplus" : "Operational Deficit"}
          </div>
        </div>

        <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
          <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Operating Margin</div>
          <div className="text-lg font-black font-mono mt-1 text-slate-900">
            {summary.profitMarginPercent}%
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">
            Pending: {currency} {Number(summary.totalFeesPending).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Expense Categorization Matrix */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2.5">
          1. Operational Expenditure by Category
        </h2>
        <table className="w-full text-xs border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase">
              <th className="border border-slate-200 px-3 py-2 text-left">Category</th>
              <th className="border border-slate-200 px-3 py-2 text-right">Voucher Count</th>
              <th className="border border-slate-200 px-3 py-2 text-right">Percentage</th>
              <th className="border border-slate-200 px-3 py-2 text-right">Total Outflow</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat: any) => (
              <tr key={cat.category} className="hover:bg-slate-50">
                <td className="border border-slate-200 px-3 py-1.5 font-medium text-slate-800">
                  {cat.label}
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right font-mono text-slate-600">
                  {cat.count}
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right font-mono text-slate-600">
                  {cat.percentage}%
                </td>
                <td className="border border-slate-200 px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                  {currency} {Number(cat.total).toLocaleString()}
                </td>
              </tr>
            ))}
            <tr className="bg-slate-50 font-bold">
              <td className="border border-slate-200 px-3 py-2 uppercase text-slate-900" colSpan={3}>
                Total Operational Disbursements
              </td>
              <td className="border border-slate-200 px-3 py-2 text-right font-mono text-rose-700 text-sm">
                -{currency} {Number(summary.totalExpenses).toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Itemized Voucher Audit Trail */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2.5">
          2. Detailed Itemized Disbursements Ledger
        </h2>
        <table className="w-full text-xs border-collapse border border-slate-200">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase">
              <th className="border border-slate-200 px-2 py-2 text-left">Voucher #</th>
              <th className="border border-slate-200 px-2 py-2 text-left">Description / Particulars</th>
              <th className="border border-slate-200 px-2 py-2 text-left">Category</th>
              <th className="border border-slate-200 px-2 py-2 text-left">Payee / Recipient</th>
              <th className="border border-slate-200 px-2 py-2 text-center">Date</th>
              <th className="border border-slate-200 px-2 py-2 text-center">Method</th>
              <th className="border border-slate-200 px-2 py-2 text-right">Cost</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={7} className="border border-slate-200 p-4 text-center text-slate-400">
                  No expense records logged for this period.
                </td>
              </tr>
            ) : (
              expenses.map((e: any) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="border border-slate-200 px-2 py-1.5 font-mono font-bold text-slate-700">
                    {e.voucherNumber}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 font-medium text-slate-900">
                    {e.title}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-600 text-[11px]">
                    {e.category.replace(/_/g, " ")}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-slate-700">
                    {e.recipientName || "—"}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center font-mono text-slate-600 text-[11px]">
                    {new Date(e.expenseDate).toLocaleDateString()}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-center text-slate-600 text-[11px]">
                    {e.paymentMethod}
                  </td>
                  <td className="border border-slate-200 px-2 py-1.5 text-right font-mono font-bold text-slate-900">
                    {currency} {Number(e.amount).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Official Signatures Verification */}
      <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
        <div>
          <div className="border-b border-slate-400 mb-1.5 h-12" />
          <div className="font-bold text-slate-800">Accountant / Cashier</div>
          <div className="text-[10px] text-slate-400">Prepared &amp; Reconciled</div>
        </div>
        <div>
          <div className="border-b border-slate-400 mb-1.5 h-12" />
          <div className="font-bold text-slate-800">Bursar / Finance Officer</div>
          <div className="text-[10px] text-slate-400">Audited &amp; Verified</div>
        </div>
        <div>
          <div className="border-b border-slate-400 mb-1.5 h-12" />
          <div className="font-bold text-slate-800">Principal / Director</div>
          <div className="text-[10px] text-slate-400">Approved for School Records</div>
        </div>
      </div>
    </div>
  );
}

export default function FinancialReportPage() {
  return (
    <div className="min-h-screen bg-slate-50 print:bg-white text-slate-900">
      <Toolbar />
      <Suspense
        fallback={
          <div className="min-h-[400px] flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        }
      >
        <FinancialReportContent />
      </Suspense>
    </div>
  );
}
