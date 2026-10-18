"use client";

import React, { useState } from "react";
import { TrendingUp, Receipt, DollarSign, ArrowLeftRight } from "lucide-react";
import { ManageExpenses } from "@/modules/expenses/ManageExpenses";
import { TrackingExpenses } from "@/modules/expenses/TrackingExpenses";

export default function AdminExpensesPage() {
  const [activeTab, setActiveTab] = useState<"tracking" | "manage">("tracking");

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("tracking")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "tracking"
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Financial Tracking &amp; Profit / Loss
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("manage")}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === "manage"
              ? "bg-teal-600 text-white shadow-xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Receipt className="w-4 h-4" />
          Manage Monthly Expenses &amp; Bills
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "tracking" ? <TrackingExpenses /> : <ManageExpenses />}
    </div>
  );
}
