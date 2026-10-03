"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Trash2,
  FileText,
  Printer,
  DollarSign,
  MessageCircle,
  User,
  Percent,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { useClasses } from "@/app/hooks/useClasses";
import { useFees } from "@/app/hooks/useFees";
import { useToast } from "@/app/hooks/useToast";
import { useConfirmDialog } from "@/app/hooks/useConfirmDialog";
import { studentsRestApi } from "@/app/api/client";

type BillRow = {
  _id: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  title: string;
  amount?: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: "unpaid" | "partial" | "paid";
};

export const FeeManager: React.FC = () => {
  const { classOptions, sectionOptions } = useClasses();
  const {
    bills,
    isLoading,
    classId,
    setClassId,
    sectionId,
    setSectionId,
    generateBills,
    recordPayment,
  } = useFees();
  const { success, error } = useToast();
  const { prompt, ConfirmDialog } = useConfirmDialog();

  const sections = classId ? sectionOptions(classId) : [];

  // Single student vs Whole class/section toggle
  const [isSpecificStudent, setIsSpecificStudent] = useState(false);
  const [classStudents, setClassStudents] = useState<{ value: string; label: string }[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [hasDiscount, setHasDiscount] = useState(false);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(0);

  // Generation form
  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [heads, setHeads] = useState<{ name: string; amount: number }[]>([
    { name: "Tuition Fee", amount: 0 },
  ]);
  const [generating, setGenerating] = useState(false);

  // Fetch students when class/section changes
  useEffect(() => {
    if (!classId) {
      setClassStudents([]);
      setSelectedStudentId("");
      return;
    }
    studentsRestApi
      .getAll({ classId, sectionId: sectionId || undefined, status: "active" })
      .then((data) => {
        if (Array.isArray(data)) {
          setClassStudents(
            data.map((s: any) => ({
              value: s.id || s._id,
              label: `${s.fullName || s.name} (Roll: ${s.rollNumber || "—"}, Adm: ${s.admissionNumber})`,
            }))
          );
        }
      })
      .catch(() => {});
  }, [classId, sectionId]);

  const total = heads.reduce((s, h) => s + (h.amount || 0), 0);

  const calculatedDiscount = useMemo(() => {
    if (!hasDiscount || !discountValue || discountValue <= 0) return 0;
    if (discountType === "percentage") {
      return Math.round((total * Math.min(100, discountValue)) / 100);
    }
    return Math.min(total, discountValue);
  }, [hasDiscount, discountType, discountValue, total]);

  const netPayable = Math.max(0, total - calculatedDiscount);

  const updateHead = (i: number, patch: Partial<{ name: string; amount: number }>) =>
    setHeads(heads.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  const addHead = () => setHeads([...heads, { name: "", amount: 0 }]);
  const removeHead = (i: number) => setHeads(heads.filter((_, idx) => idx !== i));

  const canGenerate =
    classId &&
    title.trim() &&
    issueDate &&
    dueDate &&
    heads.some((h) => h.name && h.amount > 0) &&
    (!isSpecificStudent || selectedStudentId);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const res = await generateBills({
        classId,
        sectionId: sectionId || undefined,
        studentId: isSpecificStudent ? selectedStudentId : undefined,
        discountPercentage:
          isSpecificStudent && hasDiscount && discountType === "percentage"
            ? discountValue
            : undefined,
        discountAmount:
          isSpecificStudent && hasDiscount && discountType === "fixed"
            ? discountValue
            : undefined,
        title: title.trim(),
        heads: heads.filter((h) => h.name && h.amount > 0),
        amount: isSpecificStudent && hasDiscount ? netPayable : undefined,
        issueDate,
        dueDate,
      });
      const n = (res as { created?: number; count?: number } | undefined)?.count ?? (res as { created?: number } | undefined)?.created ?? 1;
      success(`Generated ${n} fee ${n === 1 ? "bill" : "bills"} successfully.`);
      setTitle("");
      if (isSpecificStudent) {
        setSelectedStudentId("");
        setHasDiscount(false);
        setDiscountValue(0);
      }
    } catch {
      error("Could not generate bills.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePay = async (b: BillRow) => {
    const totalAmt = Number(b.totalAmount ?? b.amount ?? 0);
    const paidAmt = Number(b.paidAmount ?? 0);
    const remaining = Math.max(0, totalAmt - paidAmt);
    const input = await prompt({
      title: "Record Fee Payment",
      message: `Enter collected payment amount for student ${b.studentName} (${b.className} ${b.sectionName}).\nRemaining balance due: PKR ${remaining.toLocaleString()}`,
      defaultValue: String(remaining),
      placeholder: "e.g. 5000",
      label: "Collected Amount (PKR)",
      variant: "prompt",
      confirmText: "Record Payment",
    });
    if (input == null) return;
    const amount = Math.max(0, Number(input) || 0);
    if (!amount) return;
    try {
      await recordPayment(b._id, amount);
      success("Payment recorded.");
    } catch {
      error("Could not record payment.");
    }
  };

  const columns: Column<BillRow>[] = [
    {
      key: "student",
      header: "Student",
      render: (b) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900">{b.studentName}</span>
          <span className="text-[11px] text-slate-400 font-mono-data">
            {b.admissionNumber} · {b.className} {b.sectionName}
          </span>
        </div>
      ),
    },
    { key: "title", header: "Bill", render: (b) => <span className="text-xs">{b.title}</span> },
    {
      key: "amount",
      header: "Amount",
      render: (b) => {
        const totalAmt = Number(b.totalAmount ?? b.amount ?? 0);
        const paidAmt = Number(b.paidAmount ?? 0);
        return (
          <div className="text-xs font-mono-data">
            <span className="font-semibold text-slate-800">{paidAmt.toLocaleString()}</span>
            <span className="text-slate-400"> / {totalAmt.toLocaleString()}</span>
          </div>
        );
      },
    },
    { key: "due", header: "Due", render: (b) => <span className="text-xs text-slate-500">{b.dueDate}</span> },
    {
      key: "status",
      header: "Status",
      render: (b) => (
        <Badge
          variant={b.status === "paid" ? "success" : b.status === "partial" ? "warning" : "danger"}
          size="sm"
          dot
        >
          {b.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      render: (b) => {
        const totalAmt = Number(b.totalAmount ?? b.amount ?? 0);
        const paidAmt = Number(b.paidAmount ?? 0);
        const remaining = Math.max(0, totalAmt - paidAmt);
        const dueDateFormatted = b.dueDate
          ? new Date(b.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
          : "Due Date";

        const handleWhatsApp = () => {
          const msg = encodeURIComponent(
            `*Fee Reminder Notification*\nDear Parent, this is a reminder regarding the fee challan for *${b.studentName}* (${b.className} - ${b.sectionName}).\n\nTitle: ${b.title}\nOutstanding Balance: *Rs. ${remaining.toLocaleString()}*\nDue Date: *${dueDateFormatted}*\n\nPlease clear the dues at your earliest convenience to avoid late surcharges. Thank you!`
          );
          window.open(`https://wa.me/?text=${msg}`, "_blank");
        };

        return (
          <div className="flex items-center justify-end gap-1">
            {b.status !== "paid" && (
              <>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={handleWhatsApp}
                  title="Send Fee Reminder via WhatsApp"
                  className="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handlePay(b)}
                  title="Record payment"
                  className="p-1 text-slate-400 hover:text-emerald-600 cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                </Button>
              </>
            )}
            <Link
              href={`/print/fee-challan?bill=${b._id}`}
              target="_blank"
              title="Print challan"
              className="p-1 text-slate-400 hover:text-slate-700"
            >
              <FileText className="w-4 h-4" />
            </Link>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#0D9488]" />
          Fees & Challans
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Generate fee bills for a whole class/section and print challans in bulk.
        </p>
      </div>

      {/* Generate */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Fee Bills</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Class *"
              value={classId}
              placeholder="Select class"
              onChange={(e) => {
                setClassId(e.target.value);
                setSectionId("");
              }}
              options={classOptions}
            />
            <Select
              label="Section (optional — all if blank)"
              value={sectionId}
              placeholder={classId ? "All sections" : "Choose a class first"}
              disabled={!classId}
              onChange={(e) => setSectionId(e.target.value)}
              options={[{ value: "", label: "All sections" }, ...sections]}
            />
          </div>

          {/* Scope Toggle: Whole Class/Section vs Specific Student */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs font-semibold text-slate-800 block">Bill Scope</span>
              <span className="text-[11px] text-slate-500">
                Generate for all students in class/section, or target a specific student and apply a discount.
              </span>
            </div>
            <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-medium shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsSpecificStudent(false);
                  setSelectedStudentId("");
                  setHasDiscount(false);
                  setDiscountValue(0);
                }}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  !isSpecificStudent
                    ? "bg-[#0D9488] text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Whole Class / Section
              </button>
              <button
                type="button"
                onClick={() => setIsSpecificStudent(true)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  isSpecificStudent
                    ? "bg-[#0D9488] text-white font-bold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Specific Student
              </button>
            </div>
          </div>

          {/* Specific Student & Discount Controls */}
          {isSpecificStudent && (
            <div className="p-4 bg-teal-50/60 rounded-xl border border-teal-200 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-teal-950">
                <User className="w-4 h-4 text-[#0D9488]" />
                <span>Target Specific Student</span>
              </div>

              <Select
                label="Select Student *"
                value={selectedStudentId}
                placeholder={classId ? "Choose student..." : "Select a class first"}
                disabled={!classId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                options={classStudents}
              />

              <div className="pt-2 border-t border-teal-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={hasDiscount}
                    onChange={(e) => {
                      setHasDiscount(e.target.checked);
                      if (!e.target.checked) setDiscountValue(0);
                    }}
                    className="rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
                  />
                  <span>Apply Fee Concession / Discount to this Student</span>
                </label>

                {hasDiscount && (
                  <div className="flex items-center gap-2">
                    <Select
                      value={discountType}
                      onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                      options={[
                        { value: "percentage", label: "Percentage (%)" },
                        { value: "fixed", label: "Flat PKR (Rs.)" },
                      ]}
                      className="w-36 text-xs"
                    />
                    <Input
                      type="number"
                      min={0}
                      max={discountType === "percentage" ? 100 : total}
                      placeholder={discountType === "percentage" ? "e.g. 25" : "e.g. 1500"}
                      value={discountValue || ""}
                      onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value) || 0))}
                      className="w-32 text-xs"
                    />
                  </div>
                )}
              </div>

              {hasDiscount && discountValue > 0 && (
                <div className="flex items-center justify-between text-xs font-medium text-teal-950 bg-white p-2.5 rounded-lg border border-teal-200">
                  <span>
                    Gross Amount: PKR {total.toLocaleString()} — Discount ({discountType === "percentage" ? `${discountValue}%` : `PKR ${discountValue.toLocaleString()}`}):{" "}
                    <b className="text-rose-600">-PKR {calculatedDiscount.toLocaleString()}</b>
                  </span>
                  <span className="font-bold text-sm text-[#0D9488]">
                    Net Payable: PKR {netPayable.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Bill Title *"
              placeholder="e.g. Term 1 Fees 2026"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              label="Issue Date *"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
            />
            <Input
              label="Due Date *"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Fee heads */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Fee Heads</span>
              <Button variant="ghost" size="xs" onClick={addHead} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add head
              </Button>
            </div>
            <div className="space-y-2">
              {heads.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Head name (e.g. Tuition)"
                    value={h.name}
                    onChange={(e) => updateHead(i, { name: e.target.value })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    placeholder="Amount"
                    value={h.amount || ""}
                    onChange={(e) =>
                      updateHead(i, { amount: Math.max(0, Number(e.target.value) || 0) })
                    }
                    className="w-32"
                  />
                  <button
                    type="button"
                    onClick={() => removeHead(i)}
                    disabled={heads.length === 1}
                    className="p-2 text-slate-400 hover:text-rose-600 disabled:opacity-30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <span className="text-sm font-semibold text-slate-700">Total per student</span>
              <span className="text-lg font-bold text-[#0D9488]">{total}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2">
            {classId && sectionId && (
              <Link
                href={`/print/fee-challan?section=${sectionId}&class=${classId}`}
                target="_blank"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                <Printer className="w-4 h-4 text-[#0D9488]" />
                Print all challans for this section
              </Link>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={handleGenerate}
              isLoading={generating}
              disabled={!canGenerate}
              leftIcon={<Wallet className="w-4 h-4" />}
              className="ml-auto"
            >
              Generate Bills
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Filter + list */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="w-full sm:w-56">
          <Select
            value={classId}
            placeholder="Filter by class"
            onChange={(e) => {
              setClassId(e.target.value);
              setSectionId("");
            }}
            options={[{ value: "", label: "All classes" }, ...classOptions]}
            className="text-xs"
          />
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={sectionId}
            placeholder="Filter by section"
            disabled={!classId}
            onChange={(e) => setSectionId(e.target.value)}
            options={[{ value: "", label: "All sections" }, ...sections]}
            className="text-xs"
          />
        </div>
        <Badge variant="neutral" size="md" className="sm:ml-auto">
          {bills.length} bills
        </Badge>
      </div>

      <DataGrid<BillRow>
        columns={columns}
        data={bills as BillRow[]}
        rowKey={(b) => b._id}
        isLoading={isLoading}
        emptyIcon={<Wallet className="w-6 h-6" />}
        emptyTitle="No fee bills"
        emptyDescription="Generate bills for a class/section above to get started."
      />

      {/* Reusable Confirmation Dialog */}
      <ConfirmDialog />
    </div>
  );
};
