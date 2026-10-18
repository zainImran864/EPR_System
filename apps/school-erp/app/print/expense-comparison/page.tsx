"use client";

import React, { Suspense, useEffect, useState } from "react";
import { Printer, ArrowLeft, TrendingUp, TrendingDown, Users, Zap, FileText, Wrench } from "lucide-react";
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
        <span className="text-xs text-slate-500 font-medium">Month-over-Month Comparative Analytics</span>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Print MoM Comparison Report
        </button>
      </div>
    </div>
  );
}

function ComparisonContent() {
  const { school } = useActiveSchool();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get<any>("/expenses/tracking", { rangeType: "monthly", month: "October 2026" })
      .then((res: any) => {
        setData(res);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center gap-2">
        <Spinner size="lg" />
        <p className="text-xs text-slate-500">Compiling historical monthly expense trends…</p>
      </div>
    );
  }

  const trend: any[] = data?.monthlyTrend || [];
  const currency = school?.currencySymbol || (typeof window !== "undefined" ? localStorage.getItem("erp_school_currency_symbol") : null) || "$";

  return (
    <div className="max-w-[960px] mx-auto my-6 p-8 bg-white border border-slate-200 shadow-sm rounded-xl print:m-0 print:p-6 print:border-none print:shadow-none print:max-w-none">
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
              Comparative Analysis • Registered Session: {school?.activeYear || "2026-2027"}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-3 py-1 rounded-md bg-slate-100 border border-slate-300 text-[11px] font-bold tracking-wider uppercase text-slate-800">
              HISTORICAL EXPENSE COMPARISON
            </span>
            <p className="text-xs text-slate-500 font-mono mt-2">
              Generated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </p>
            <p className="text-xs font-bold text-slate-700 mt-0.5">
              Cycle: Last 6 Billing Cycles
            </p>
          </div>
        </div>
      </div>

      {/* MoM Detailed Matrix */}
      <div className="mb-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 border-b border-slate-200 pb-1.5 mb-2.5">
          1. Multi-Month Expense &amp; Revenue Reconciliation
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-[10px] uppercase">
                <th className="border border-slate-200 px-2 py-2 text-left">Month</th>
                <th className="border border-slate-200 px-2 py-2 text-right">Faculty &amp; Staff Pay</th>
                <th className="border border-slate-200 px-2 py-2 text-right">Utilities &amp; Power</th>
                <th className="border border-slate-200 px-2 py-2 text-right">Stationery &amp; Print</th>
                <th className="border border-slate-200 px-2 py-2 text-right">Repairs &amp; Maint.</th>
                <th className="border border-slate-200 px-2 py-2 text-right">Other</th>
                <th className="border border-slate-200 px-2 py-2 text-right font-bold bg-slate-200/60">Total Outflow</th>
                <th className="border border-slate-200 px-2 py-2 text-right">Fees Inflow</th>
                <th className="border border-slate-200 px-2 py-2 text-right">Net Surplus</th>
                <th className="border border-slate-200 px-2 py-2 text-center">MoM Delta</th>
              </tr>
            </thead>
            <tbody>
              {trend.map((t, idx) => {
                const prev = idx > 0 ? trend[idx - 1] : null;
                const momDelta = prev && prev.expenses > 0
                  ? Math.round(((t.expenses - prev.expenses) / prev.expenses) * 100)
                  : null;

                const isSurplus = t.netProfit >= 0;

                return (
                  <tr key={t.month} className="hover:bg-slate-50">
                    <td className="border border-slate-200 px-2 py-2 font-bold text-slate-900">
                      {t.month}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono text-slate-800">
                      {currency} {Number(t.salaries || 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono text-slate-800">
                      {currency} {Number(t.utilities || 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono text-slate-800">
                      {currency} {Number(t.stationery || 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono text-slate-800">
                      {currency} {Number(t.maintenance || 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono text-slate-700">
                      {currency} {Number(t.other || 0).toLocaleString()}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono font-black text-rose-700 bg-rose-50/30">
                      -{currency} {Number(t.expenses).toLocaleString()}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                      +{currency} {Number(t.feesCollected).toLocaleString()}
                    </td>
                    <td className={`border border-slate-200 px-2 py-2 text-right font-mono font-bold ${isSurplus ? "text-emerald-700" : "text-rose-700"}`}>
                      {isSurplus ? "+" : "-"}{currency} {Math.abs(t.netProfit).toLocaleString()}
                    </td>
                    <td className="border border-slate-200 px-2 py-2 text-center font-mono font-semibold text-[11px]">
                      {momDelta === null ? (
                        <span className="text-slate-400">—</span>
                      ) : momDelta > 0 ? (
                        <span className="text-rose-600">+{momDelta}% ▲</span>
                      ) : momDelta < 0 ? (
                        <span className="text-emerald-600">{momDelta}% ▼</span>
                      ) : (
                        <span className="text-slate-500">0%</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytical Observations & Notes */}
      <div className="mb-8 p-4 rounded-lg bg-slate-50 border border-slate-200 space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          2. Executive Audit Notes &amp; Observations
        </h3>
        <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
          <li>
            <strong>Faculty Payroll:</strong> Constitutes the principal recurring operational expenditure, maintaining steady budgetary compliance.
          </li>
          <li>
            <strong>Utility Variance:</strong> Electricity, diesel/fuel, and water consumption fluctuations are tracked on a per-bill basis with invoice vouchers archived.
          </li>
          <li>
            <strong>Fee Collection Health:</strong> Fee receipts are correlated directly against operational outflows to maintain positive cashflow cushions.
          </li>
        </ul>
      </div>

      {/* Official Signatures Verification */}
      <div className="pt-8 border-t border-slate-300 grid grid-cols-3 gap-6 text-center text-xs text-slate-600">
        <div>
          <div className="border-b border-slate-400 mb-1.5 h-12" />
          <div className="font-bold text-slate-800">Chief Accountant</div>
          <div className="text-[10px] text-slate-400">Reconciled Monthly Books</div>
        </div>
        <div>
          <div className="border-b border-slate-400 mb-1.5 h-12" />
          <div className="font-bold text-slate-800">Finance Committee Chair</div>
          <div className="text-[10px] text-slate-400">Budget Variance Verified</div>
        </div>
        <div>
          <div className="border-b border-slate-400 mb-1.5 h-12" />
          <div className="font-bold text-slate-800">School Principal</div>
          <div className="text-[10px] text-slate-400">Authorized &amp; Signed</div>
        </div>
      </div>
    </div>
  );
}

export default function ExpenseComparisonReportPage() {
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
        <ComparisonContent />
      </Suspense>
    </div>
  );
}
