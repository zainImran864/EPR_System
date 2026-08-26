"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Wallet,
  Plus,
  Trash2,
  FileText,
  Printer,
  DollarSign,
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

type BillRow = {
  _id: string;
  studentName: string;
  admissionNumber: string;
  className: string;
  sectionName: string;
  title: string;
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

  const sections = classId ? sectionOptions(classId) : [];

  // Generation form
  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [heads, setHeads] = useState<{ name: string; amount: number }[]>([
    { name: "Tuition Fee", amount: 0 },
  ]);
  const [generating, setGenerating] = useState(false);

  const total = heads.reduce((s, h) => s + (h.amount || 0), 0);

  const updateHead = (i: number, patch: Partial<{ name: string; amount: number }>) =>
    setHeads(heads.map((h, idx) => (idx === i ? { ...h, ...patch } : h)));
  const addHead = () => setHeads([...heads, { name: "", amount: 0 }]);
  const removeHead = (i: number) => setHeads(heads.filter((_, idx) => idx !== i));

  const canGenerate =
    classId && title.trim() && issueDate && dueDate && heads.some((h) => h.name && h.amount > 0);

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setGenerating(true);
    try {
      const res = await generateBills({
        classId,
        sectionId: sectionId || undefined,
        title: title.trim(),
        heads: heads.filter((h) => h.name && h.amount > 0),
        issueDate,
        dueDate,
      });
      const n = (res as { created?: number } | undefined)?.created ?? 0;
      success(`Generated ${n} fee ${n === 1 ? "bill" : "bills"}.`);
      setTitle("");
    } catch {
      error("Could not generate bills.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePay = async (b: BillRow) => {
    const remaining = b.totalAmount - b.paidAmount;
    const input = window.prompt(
      `Record payment for ${b.studentName} (remaining ${remaining}):`,
      String(remaining)
    );
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
      render: (b) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{b.paidAmount}</span>
          <span className="text-slate-400"> / {b.totalAmount}</span>
        </div>
      ),
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
      render: (b) => (
        <div className="flex items-center justify-end gap-1">
          {b.status !== "paid" && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => handlePay(b)}
              title="Record payment"
              className="p-1 text-slate-400 hover:text-emerald-600"
            >
              <DollarSign className="w-4 h-4" />
            </Button>
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
      ),
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
    </div>
  );
};
