"use client";

import React, { useState, useMemo } from "react";
import {
  Receipt,
  Plus,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  FileText,
  Building,
  Zap,
  Users,
  Wrench,
  BookOpen,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useExpenses, ExpenseItem } from "@/app/hooks/useExpenses";

const CATEGORIES = [
  { value: "ALL", label: "All Categories" },
  { value: "UTILITIES", label: "Utility Bills (Electric, Gas, Water, Net)" },
  { value: "SALARIES", label: "Teachers & Staff Salaries" },
  { value: "STATIONERY_PAPER", label: "Paper & Printing Bills, Stationery" },
  { value: "MAINTENANCE", label: "Building Repairs & Maintenance" },
  { value: "RENT", label: "Campus Rent" },
  { value: "EVENTS", label: "Events, Sports & Functions" },
  { value: "LAB_LIBRARY", label: "Lab Equipment & Library" },
  { value: "MISCELLANEOUS", label: "Miscellaneous & Operations" },
];

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

const PAYMENT_METHODS = [
  { value: "Cash", label: "Cash" },
  { value: "Bank Transfer", label: "Bank Transfer" },
  { value: "Cheque", label: "Cheque" },
  { value: "Online", label: "Online Payment" },
];

export const ManageExpenses: React.FC = () => {
  const { expenses, totalAmount, count, loading, createExpense, deleteExpense } =
    useExpenses();

  const [selectedMonth, setSelectedMonth] = useState<string>("October 2026");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Form State
  const [form, setForm] = useState({
    title: "",
    category: "UTILITIES",
    amount: "",
    expenseDate: new Date().toISOString().split("T")[0],
    month: "October 2026",
    paymentMethod: "Bank Transfer",
    recipientName: "",
    invoiceNumber: "",
    remarks: "",
  });

  const availableMonths = useMemo(() => {
    const months = new Set<string>(["October 2026", "September 2026", "August 2026"]);
    expenses.forEach((e) => {
      if (e.month) months.add(e.month);
    });
    return Array.from(months);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (selectedMonth !== "ALL" && e.month !== selectedMonth) return false;
      if (selectedCategory !== "ALL" && e.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          e.title.toLowerCase().includes(q) ||
          e.voucherNumber.toLowerCase().includes(q) ||
          (e.recipientName && e.recipientName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [expenses, selectedMonth, selectedCategory, searchQuery]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  }, [filteredExpenses]);

  const handleOpenAddModal = (defaultCat?: string) => {
    setForm({
      title: "",
      category: defaultCat || "UTILITIES",
      amount: "",
      expenseDate: new Date().toISOString().split("T")[0],
      month: selectedMonth === "ALL" ? "October 2026" : selectedMonth,
      paymentMethod: "Bank Transfer",
      recipientName: "",
      invoiceNumber: "",
      remarks: "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.amount || Number(form.amount) <= 0) return;

    setSubmitting(true);
    try {
      await createExpense({
        title: form.title.trim(),
        category: form.category,
        amount: Number(form.amount),
        expenseDate: form.expenseDate,
        month: form.month,
        paymentMethod: form.paymentMethod,
        recipientName: form.recipientName.trim() || undefined,
        invoiceNumber: form.invoiceNumber.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
      });
      setIsModalOpen(false);
    } catch {
      // toast shown in hook
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200/60 shrink-0">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Manage Monthly School Expenses
              </h2>
              <p className="text-xs text-slate-500">
                Record and manage campus bills: utility tariffs, teacher salaries, paper supplies, and repairs
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleOpenAddModal()}
            leftIcon={<Plus className="w-4 h-4" />}
            className="shadow-xs text-xs font-bold"
          >
            Record Expense Voucher
          </Button>
        </div>
      </div>

      {/* Quick Category Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => handleOpenAddModal("UTILITIES")}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:bg-amber-50/40 transition-all text-left flex items-start justify-between group cursor-pointer shadow-2xs"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              + Add Utility Bill
            </span>
            <span className="text-xs font-semibold text-slate-800 mt-1 block">
              Electricity, Water, Net
            </span>
          </div>
          <span className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0 group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenAddModal("SALARIES")}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/40 transition-all text-left flex items-start justify-between group cursor-pointer shadow-2xs"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              + Disburse Salaries
            </span>
            <span className="text-xs font-semibold text-slate-800 mt-1 block">
              Faculty &amp; Staff Payroll
            </span>
          </div>
          <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shrink-0 group-hover:scale-105 transition-transform">
            <Users className="w-4 h-4" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenAddModal("STATIONERY_PAPER")}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-sky-400 hover:bg-sky-50/40 transition-all text-left flex items-start justify-between group cursor-pointer shadow-2xs"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              + Paper &amp; Printing
            </span>
            <span className="text-xs font-semibold text-slate-800 mt-1 block">
              Paper Reams, Toner, Books
            </span>
          </div>
          <span className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200 shrink-0 group-hover:scale-105 transition-transform">
            <FileText className="w-4 h-4" />
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleOpenAddModal("MAINTENANCE")}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 transition-all text-left flex items-start justify-between group cursor-pointer shadow-2xs"
        >
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              + Maintenance Bill
            </span>
            <span className="text-xs font-semibold text-slate-800 mt-1 block">
              Repairs, Generator Fuel
            </span>
          </div>
          <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-200 shrink-0 group-hover:scale-105 transition-transform">
            <Wrench className="w-4 h-4" />
          </span>
        </button>
      </div>

      {/* Filter and Overview Card */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              Month:
            </div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-teal-600"
            >
              <option value="ALL">All Months</option>
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mr-1">
              <Filter className="w-3.5 h-3.5 text-teal-600" />
              Category:
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-teal-600"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full md:w-64">
            <Input
              placeholder="Search voucher or vendor…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
            />
          </div>
        </div>

        {/* Total Incurred Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100/80 text-teal-800 flex items-center justify-center font-bold text-sm">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500">
                Total Expenses for {selectedMonth === "ALL" ? "All Time" : selectedMonth}
              </span>
              <p className="text-lg sm:text-xl font-bold font-mono text-slate-900 leading-tight">
                ${filteredTotal.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="text-right">
            <Badge variant="neutral" size="sm">
              {filteredExpenses.length} Expense Voucher(s)
            </Badge>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading expense vouchers…
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 space-y-2">
            <Receipt className="w-8 h-8 mx-auto text-slate-300" />
            <p>No expense vouchers found for this period.</p>
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleOpenAddModal()}
              className="mt-2"
            >
              Record First Expense
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Voucher #</th>
                  <th className="py-2.5 px-3">Title &amp; Category</th>
                  <th className="py-2.5 px-3">Recipient / Vendor</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Payment Method</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((e) => (
                  <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-slate-800">
                      {e.voucherNumber}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{e.title}</div>
                      <div className="inline-flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        {CATEGORY_ICONS[e.category]}
                        <span>{e.category.replace(/_/g, " ")}</span>
                        {e.invoiceNumber && (
                          <span className="font-mono text-slate-400">
                            • Inv #{e.invoiceNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-slate-700">
                      {e.recipientName || "—"}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-600">
                      {new Date(e.expenseDate).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="neutral" size="sm">
                        {e.paymentMethod}
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 text-sm">
                      -${Number(e.amount).toLocaleString()}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => deleteExpense(e.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete Expense Voucher"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add Expense Voucher Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center border border-teal-200">
                  <Receipt className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  Record New School Expense Voucher
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <Input
                label="Expense Title *"
                placeholder="e.g. October 2026 Electricity Bill or Faculty Payroll"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Category *"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  options={CATEGORIES.filter((c) => c.value !== "ALL")}
                  required
                />
                <Input
                  label="Amount ($) *"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Expense Date *"
                  type="date"
                  value={form.expenseDate}
                  onChange={(e) => setForm({ ...form, expenseDate: e.target.value })}
                  required
                />
                <Input
                  label="Month / Cycle *"
                  value={form.month}
                  onChange={(e) => setForm({ ...form, month: e.target.value })}
                  placeholder="e.g. October 2026"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Payment Method *"
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  options={PAYMENT_METHODS}
                  required
                />
                <Input
                  label="Recipient / Vendor Name"
                  placeholder="e.g. Power Co, Stationery Mart"
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                />
              </div>

              <Input
                label="Invoice / Bill Reference #"
                placeholder="e.g. ELEC-992384 or INV-4421"
                value={form.invoiceNumber}
                onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })}
              />

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Remarks / Notes
                </label>
                <textarea
                  className="w-full text-xs rounded-xl border border-slate-200 px-3 py-2 focus:border-teal-600 focus:outline-none min-h-[60px]"
                  placeholder="Additional expense details, check numbers, etc."
                  value={form.remarks}
                  onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={submitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Save Expense Voucher
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
