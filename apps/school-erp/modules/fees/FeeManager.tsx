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
  AlertTriangle,
  Clock,
  CheckCircle2,
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
  baseAmount?: number;
  lateFeeAmount?: number;
  lateFeeApplied?: number;
  isPastDue?: boolean;
  payableAfterDueDate?: number;
  amount?: number;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: "unpaid" | "partial" | "paid" | "overdue";
};

export const FeeManager: React.FC = () => {
  const { classOptions, sectionOptions } = useClasses();
  const {
    bills,
    lateFeeAmount,
    overdueStudents,
    isLoading,
    classId,
    setClassId,
    sectionId,
    setSectionId,
    updateLateFeePolicy,
    generateBills,
    recordPayment,
  } = useFees();
  const { success, error } = useToast();
  const { prompt, ConfirmDialog } = useConfirmDialog();

  const sections = classId ? sectionOptions(classId) : [];

  // Late Fee Policy State
  const [policyLateFeeInput, setPolicyLateFeeInput] = useState<number>(500);
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    setPolicyLateFeeInput(lateFeeAmount);
  }, [lateFeeAmount]);

  const handleSaveLateFeePolicy = async () => {
    setSavingPolicy(true);
    try {
      await updateLateFeePolicy(Math.max(0, Number(policyLateFeeInput) || 0));
      success(`Late fee increment after due date updated to +${policyLateFeeInput}.`);
    } catch {
      error("Could not update late fee policy.");
    } finally {
      setSavingPolicy(false);
    }
  };

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
  const [customLateFee, setCustomLateFee] = useState<number>(500);
  const [heads, setHeads] = useState<{ name: string; amount: number }[]>([
    { name: "Tuition Fee", amount: 0 },
  ]);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setCustomLateFee(lateFeeAmount);
  }, [lateFeeAmount]);

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
        lateFeeAmount: Math.max(0, Number(customLateFee) || 0),
        issueDate,
        dueDate,
      });
      const n = (res as { created?: number; count?: number } | undefined)?.count ?? (res as { created?: number } | undefined)?.created ?? 1;
      success(`Generated ${n} fee ${n === 1 ? "bill" : "bills"} with +${customLateFee} late fee policy.`);
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
      header: "Fee & After-Due Increment",
      render: (b) => {
        const baseAmt = Number(b.baseAmount ?? b.amount ?? 0);
        const lateFee = Number(b.lateFeeAmount ?? lateFeeAmount ?? 500);
        const totalAmt = Number(b.totalAmount ?? b.amount ?? 0);
        const paidAmt = Number(b.paidAmount ?? 0);
        const isPastDue = Boolean(b.isPastDue) && b.status !== "paid";
        return (
          <div className="text-xs font-mono-data space-y-0.5">
            <div>
              <span className="font-semibold text-slate-800">{paidAmt.toLocaleString()}</span>
              <span className="text-slate-400"> / {totalAmt.toLocaleString()}</span>
            </div>
            <div className={isPastDue ? "text-[10px] font-bold text-rose-600" : "text-[10px] text-amber-700"}>
              {isPastDue
                ? `Base ${baseAmt.toLocaleString()} + Late Fee +${lateFee.toLocaleString()} Applied`
                : `After Due Date: +${lateFee.toLocaleString()} (${(baseAmt + lateFee).toLocaleString()})`}
            </div>
          </div>
        );
      },
    },
    {
      key: "due",
      header: "Due Date",
      render: (b) => {
        const isPastDue = Boolean(b.isPastDue) && b.status !== "paid";
        return (
          <div className="flex flex-col">
            <span className={`text-xs font-medium ${isPastDue ? "text-rose-600 font-bold" : "text-slate-600"}`}>
              {b.dueDate}
            </span>
            {isPastDue && (
              <span className="text-[10px] text-rose-600 font-semibold">Due Date Passed</span>
            )}
          </div>
        );
      },
    },
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
        const lateFee = Number(b.lateFeeAmount ?? lateFeeAmount ?? 500);
        const remaining = Math.max(0, totalAmt - paidAmt);
        const dueDateFormatted = b.dueDate
          ? new Date(b.dueDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
          : "Due Date";

        const handleWhatsApp = () => {
          const msg = encodeURIComponent(
            `*Fee Reminder Notification*\nDear Parent, this is a reminder regarding the fee challan for *${b.studentName}* (${b.className} - ${b.sectionName}).\n\nTitle: ${b.title}\nDue Date: *${dueDateFormatted}*\nLate Fee Increment After Due Date: *+${lateFee.toLocaleString()}*\nOutstanding Balance: *Rs. ${remaining.toLocaleString()}*\n\nPlease clear the dues at your earliest convenience. Thank you!`
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

  const activeOverdueList =
    overdueStudents.length > 0
      ? overdueStudents
      : bills.filter((b) => b.isPastDue && b.status !== "paid");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#0D9488]" />
          Fees & Challans
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Generate fee bills, configure automatic late-fee increment after due date, and track overdue student alerts.
        </p>
      </div>

      {/* Admin Overdue Due-Date Alert Message */}
      {activeOverdueList.length > 0 && (
        <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 shadow-xs space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-bold text-rose-900">
                Overdue Fee Due-Date Alert: {activeOverdueList.length} Student
                {activeOverdueList.length === 1 ? " Has" : "s Have"} Passed the Fee Due Date
              </h3>
              <p className="text-xs text-rose-800 mt-0.5">
                The late fee increment of <b>+{lateFeeAmount}</b> has been automatically applied to their fee cards and notifications have been sent to their Parents.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
            {activeOverdueList.slice(0, 6).map((st: any, idx: number) => (
              <div
                key={st.challanId || st._id || idx}
                className="bg-white/90 rounded-lg border border-rose-200 px-3 py-2 text-xs flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">{st.studentName}</p>
                  <p className="text-[11px] text-slate-500 truncate">
                    {st.title} · Due {st.dueDate ? new Date(st.dueDate).toISOString().split("T")[0] : ""}
                  </p>
                </div>
                <span className="text-[11px] font-mono-data font-bold text-rose-600 shrink-0">
                  +{st.lateFeeIncrement ?? st.lateFeeAmount ?? lateFeeAmount} Fine
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Late Fee / After Due-Date Increment Configuration Card */}
      <Card>
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-50/60 via-white to-amber-50/40">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#0D9488]" />
              <h3 className="text-sm font-bold text-slate-900">
                Late Fee Increment Policy (After Due Date)
              </h3>
              <Badge variant="warning" size="sm">
                +{lateFeeAmount} After Due Date
              </Badge>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl">
              Set the amount automatically added to unpaid fee challans once the due date passes. Both the School Admin and Parent receive automatic overdue notifications, and this increment is printed on every Fee Card and Challan.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-36">
              <Input
                type="number"
                min={0}
                value={policyLateFeeInput}
                onChange={(e) => setPolicyLateFeeInput(Math.max(0, Number(e.target.value) || 0))}
                placeholder="e.g. 500"
                aria-label="Late Fee Increment Amount"
              />
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveLateFeePolicy}
              isLoading={savingPolicy}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              Save Increment
            </Button>
          </div>
        </CardContent>
      </Card>

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <Input
              label="Increment After Due Date"
              type="number"
              min={0}
              placeholder="e.g. 500"
              value={customLateFee}
              onChange={(e) => setCustomLateFee(Math.max(0, Number(e.target.value) || 0))}
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
            <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-slate-100">
              <div>
                <span className="text-sm font-semibold text-slate-700 block">
                  Total per student (Within Due Date)
                </span>
                <span className="text-xs text-amber-700 font-medium">
                  After Due Date (+{customLateFee} Increment):{" "}
                  <b className="font-mono-data">{(isSpecificStudent && hasDiscount ? netPayable : total) + (customLateFee || 0)}</b>
                </span>
              </div>
              <span className="text-lg font-bold font-mono-data text-[#0D9488]">{total}</span>
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
