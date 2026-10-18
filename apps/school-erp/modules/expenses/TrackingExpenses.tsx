"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Receipt,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Users,
  FileText,
  Wrench,
  Building,
  Sparkles,
  BookOpen,
  RefreshCw,
  Printer,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useExpenses } from "@/app/hooks/useExpenses";

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  UTILITIES: <Zap className="w-3.5 h-3.5 text-amber-500" />,
  SALARIES: <Users className="w-3.5 h-3.5 text-emerald-500" />,
  STATIONERY_PAPER: <FileText className="w-3.5 h-3.5 text-sky-500" />,
  MAINTENANCE: <Wrench className="w-3.5 h-3.5 text-indigo-500" />,
  RENT: <Building className="w-3.5 h-3.5 text-purple-500" />,
  EVENTS: <Sparkles className="w-3.5 h-3.5 text-pink-500" />,
  LAB_LIBRARY: <BookOpen className="w-3.5 h-3.5 text-teal-500" />,
  MISCELLANEOUS: <Receipt className="w-3.5 h-3.5 text-slate-500" />,
};

const CATEGORY_COLORS: Record<string, string> = {
  UTILITIES: "bg-amber-500",
  SALARIES: "bg-emerald-500",
  STATIONERY_PAPER: "bg-sky-500",
  MAINTENANCE: "bg-indigo-500",
  RENT: "bg-purple-500",
  EVENTS: "bg-pink-500",
  LAB_LIBRARY: "bg-teal-500",
  MISCELLANEOUS: "bg-slate-500",
};

export const TrackingExpenses: React.FC = () => {
  const { tracking, trackingLoading, fetchTracking } = useExpenses();

  const [rangeType, setRangeType] = useState<"monthly" | "yearly" | "custom">("monthly");
  const [selectedMonth, setSelectedMonth] = useState<string>("October 2026");
  const [selectedYear, setSelectedYear] = useState<string>("2026-2027");
  const [startDate, setStartDate] = useState<string>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split("T")[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  const handleApplyFilter = () => {
    fetchTracking({
      rangeType,
      month: rangeType === "monthly" ? selectedMonth : undefined,
      year: rangeType === "yearly" ? selectedYear : undefined,
      startDate: rangeType === "custom" ? startDate : undefined,
      endDate: rangeType === "custom" ? endDate : undefined,
    });
  };

  useEffect(() => {
    handleApplyFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeType, selectedMonth, selectedYear]);

  const summary = tracking?.summary || {
    totalFeesBilled: 0,
    totalFeesCollected: 0,
    totalFeesPending: 0,
    totalExpenses: 0,
    netProfitLoss: 0,
    isProfitable: true,
    profitMarginPercent: 0,
    expenseCount: 0,
    feeChallanCount: 0,
  };

  const isProfit = summary.netProfitLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Header & Range Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200/60 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Financial Tracking &amp; Profit / Loss Analytics
              </h2>
              <p className="text-xs text-slate-500">
                Track revenue from student fee collections versus school operating expenses across custom monthly and yearly ranges
              </p>
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setRangeType("monthly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                rangeType === "monthly"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setRangeType("yearly")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                rangeType === "yearly"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Yearly
            </button>
            <button
              type="button"
              onClick={() => setRangeType("custom")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                rangeType === "custom"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Date Range
            </button>
          </div>

          {/* Conditional Range Selectors */}
          {rangeType === "monthly" && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs"
            >
              <option value="October 2026">October 2026</option>
              <option value="September 2026">September 2026</option>
              <option value="August 2026">August 2026</option>
              <option value="July 2026">July 2026</option>
              <option value="June 2026">June 2026</option>
              <option value="May 2026">May 2026</option>
            </select>
          )}

          {rangeType === "yearly" && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800 shadow-2xs"
            >
              <option value="2026-2027">Academic Year 2026-2027</option>
              <option value="2025-2026">Academic Year 2025-2026</option>
              <option value="2026">Calendar Year 2026</option>
            </select>
          )}

          {rangeType === "custom" && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 shadow-2xs"
              />
              <span className="text-xs text-slate-400">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-mono font-semibold text-slate-800 shadow-2xs"
              />
              <Button
                variant="secondary"
                size="sm"
                onClick={handleApplyFilter}
                className="text-xs"
              >
                Apply
              </Button>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleApplyFilter}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${trackingLoading ? "animate-spin" : ""}`} />}
            className="text-xs"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* 4 Core Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fees Revenue */}
        <Card className="p-4 flex flex-col justify-between border-slate-200/90 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Fee Collection (Revenue)
              </span>
              <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-emerald-600 mt-2">
              ${summary.totalFeesCollected.toLocaleString()}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Billed: ${summary.totalFeesBilled.toLocaleString()}</span>
            <span className="text-amber-600 font-semibold">
              Pending: ${summary.totalFeesPending.toLocaleString()}
            </span>
          </div>
        </Card>

        {/* Total Expenses Incurred */}
        <Card className="p-4 flex flex-col justify-between border-slate-200/90 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Operating Expenses
              </span>
              <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <ArrowDownRight className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-rose-600 mt-2">
              -${summary.totalExpenses.toLocaleString()}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Period: {tracking?.periodLabel || "Selected"}</span>
            <span>{summary.expenseCount} Vouchers</span>
          </div>
        </Card>

        {/* Net Profit / Net Loss */}
        <Card
          className={`p-4 flex flex-col justify-between border-2 shadow-2xs ${
            isProfit
              ? "bg-emerald-50/40 border-emerald-300"
              : "bg-rose-50/40 border-rose-300"
          }`}
        >
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Net Profit / Loss (P&amp;L)
              </span>
              <Badge variant={isProfit ? "success" : "danger"} size="sm">
                {isProfit ? "NET PROFIT" : "NET LOSS"}
              </Badge>
            </div>
            <p
              className={`text-2xl font-bold font-mono mt-2 ${
                isProfit ? "text-emerald-700" : "text-rose-700"
              }`}
            >
              {isProfit ? "+" : "-"}${Math.abs(summary.netProfitLoss).toLocaleString()}
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px] font-semibold">
            <span className="text-slate-600">Revenue minus Expenses</span>
            <span className={isProfit ? "text-emerald-700" : "text-rose-700"}>
              {isProfit ? "✓ Positive Cashflow" : "⚠ Deficit"}
            </span>
          </div>
        </Card>

        {/* Profit Margin % */}
        <Card className="p-4 flex flex-col justify-between border-slate-200/90 shadow-2xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Operating Profit Margin
              </span>
              <span className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                <PieChart className="w-4 h-4" />
              </span>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
              {summary.profitMarginPercent}%
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Target: &gt;20%</span>
            <span className="text-teal-700 font-semibold font-mono">
              {summary.feeChallanCount} Challans
            </span>
          </div>
        </Card>
      </div>

      {/* Grid: 1) Expense Category Breakdown, 2) Monthly Past 6-Month Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (5 Cols) */}
        <Card className="lg:col-span-5 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Expense Breakdown by Category
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">
              Total: ${summary.totalExpenses.toLocaleString()}
            </span>
          </div>

          {tracking?.categoryBreakdown?.length === 0 ? (
            <p className="text-xs text-slate-400 py-8 text-center">
              No expenses recorded in this period.
            </p>
          ) : (
            <div className="space-y-3.5">
              {tracking?.categoryBreakdown?.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      {CATEGORY_ICONS[cat.category]}
                      <span className="font-semibold text-slate-800">
                        {cat.label}
                      </span>
                    </div>
                    <div className="font-mono text-right">
                      <span className="font-bold text-slate-900">
                        ${cat.total.toLocaleString()}
                      </span>
                      <span className="text-slate-400 ml-1.5 text-[11px]">
                        ({cat.percentage}%)
                      </span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        CATEGORY_COLORS[cat.category] || "bg-teal-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Past 6 Months Trend Table & Bars (7 Cols) */}
        <Card className="lg:col-span-7 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              <h3 className="text-sm font-bold text-slate-900">
                6-Month Financial Trend (Fees Collection vs Expenses)
              </h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Auto-aggregated
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3 text-right">Fees Collected</th>
                  <th className="py-2.5 px-3 text-right">Expenses</th>
                  <th className="py-2.5 px-3 text-right">Net Profit / Loss</th>
                  <th className="py-2.5 px-3 text-center">Cashflow Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tracking?.monthlyTrend?.map((t) => {
                  const mProfit = t.netProfit >= 0;
                  return (
                    <tr key={t.month} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-bold text-slate-800">
                        {t.month}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600">
                        +${t.feesCollected.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold text-rose-600">
                        -${t.expenses.toLocaleString()}
                      </td>
                      <td
                        className={`py-3 px-3 text-right font-mono font-bold ${
                          mProfit ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {mProfit ? "+" : "-"}${Math.abs(t.netProfit).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <Badge variant={mProfit ? "success" : "danger"} size="sm">
                          {mProfit ? "PROFIT" : "DEFICIT"}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Recent Expense Vouchers for this period */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Recent Expense Disbursements ({tracking?.recentExpenses?.length || 0})
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Period: {tracking?.periodLabel}
          </span>
        </div>

        {tracking?.recentExpenses?.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No expense vouchers found in this period.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-2 px-3">Voucher #</th>
                  <th className="py-2 px-3">Title</th>
                  <th className="py-2 px-3">Category</th>
                  <th className="py-2 px-3">Recipient / Vendor</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tracking?.recentExpenses?.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-800">
                      {e.voucherNumber}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      {e.title}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                        {CATEGORY_ICONS[e.category]}
                        <span>{e.category.replace(/_/g, " ")}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      {e.recipientName || "—"}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">
                      {new Date(e.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-600">
                      -${Number(e.amount).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};
