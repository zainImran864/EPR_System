"use client";

import React from "react";
import Link from "next/link";
import { Wallet, FileText, AlertTriangle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useAuth } from "@/app/hooks/useAuth";
import { useStudentBills } from "@/app/hooks/useFees";

export interface MyFeesViewProps {
  title: string;
  subtitle: string;
}

export const MyFeesView: React.FC<MyFeesViewProps> = ({ title, subtitle }) => {
  const { user } = useAuth();
  const ctx = user?.studentContext;
  const { bills, isLoading } = useStudentBills(ctx?.studentId);

  const overdueBills = bills.filter((b) => b.isPastDue && b.status !== "paid");

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#0D9488]" />
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>

      {/* Parent / Student Overdue Due-Date Notification Banner */}
      {overdueBills.length > 0 && (
        <div className="rounded-xl border border-rose-300 bg-rose-50/90 p-4 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xs sm:text-sm font-bold text-rose-900">
                Fee Due Date Passed — Late Fee Increment Added ({overdueBills.length}{" "}
                {overdueBills.length === 1 ? "Bill" : "Bills"})
              </h3>
              <p className="text-xs text-rose-800">
                The due date for{" "}
                <b>
                  {overdueBills.map((b) => `${b.title} (Due: ${b.dueDate})`).join(", ")}
                </b>{" "}
                has passed. A late fee increment of{" "}
                <b>+{overdueBills[0]?.lateFeeAmount ?? 500}</b> has been added to your fee card.
                Please clear the updated balance at the earliest.
              </p>
            </div>
          </div>
        </div>
      )}

      {!ctx ? (
        <EmptyState
          icon={<Wallet className="w-6 h-6" />}
          title="No student linked"
          description="This account isn't linked to a student yet. Please contact your school administrator."
        />
      ) : isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : bills.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-6 h-6" />}
          title="No fee bills"
          description="Fee bills issued by the school will appear here."
        />
      ) : (
        <div className="space-y-3">
          {bills.map((b) => {
            const baseAmt = Number(b.baseAmount ?? b.amount ?? b.totalAmount ?? 0);
            const lateFeeAmt = Number(b.lateFeeAmount ?? b.fineAmount ?? 500);
            const isPastDue = Boolean(b.isPastDue) && b.status !== "paid";
            const payableTotal = isPastDue ? baseAmt + lateFeeAmt : Number(b.totalAmount ?? baseAmt);
            const balance = Math.max(0, payableTotal - (b.paidAmount || 0));

            return (
              <Card
                key={b._id}
                className={isPastDue ? "border-rose-300 ring-1 ring-rose-200/60" : ""}
              >
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900">{b.title}</h3>
                        <Badge
                          variant={
                            b.status === "paid"
                              ? "success"
                              : b.status === "partial"
                              ? "warning"
                              : "danger"
                          }
                          size="sm"
                          dot
                        >
                          {b.status}
                        </Badge>
                        {isPastDue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-bold">
                            <Clock className="w-3 h-3" />
                            Due Date Passed · Late Fee +{lateFeeAmt} Applied
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Issued {b.issueDate} · Due Date: <b className={isPastDue ? "text-rose-600" : "text-slate-700"}>{b.dueDate}</b>
                      </p>
                    </div>
                    <Link
                      href={`/print/fee-challan?bill=${b._id}`}
                      target="_blank"
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shrink-0"
                    >
                      <FileText className="w-4 h-4 text-[#0D9488]" />
                      Challan
                    </Link>
                  </div>

                  {/* Fee Card Stats including Late Fee Increment */}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <Stat label="Base Fee" value={baseAmt} />
                    <Stat
                      label={isPastDue ? "Late Fee Increment (Applied)" : "Increment After Due Date"}
                      value={lateFeeAmt}
                      prefix="+"
                      highlight={isPastDue}
                    />
                    <Stat label="Paid" value={b.paidAmount || 0} />
                    <Stat label="Total Balance Due" value={balance} highlight={balance > 0} />
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                    <span>
                      Within Due Date ({b.dueDate}): <b className="text-slate-800 font-mono-data">{baseAmt}</b>
                    </span>
                    <span className={isPastDue ? "text-rose-600 font-bold" : "text-amber-700 font-semibold"}>
                      Payable After Due Date (+{lateFeeAmt} Increment):{" "}
                      <b className="font-mono-data">{baseAmt + lateFeeAmt}</b>
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: number; prefix?: string; highlight?: boolean }> = ({
  label,
  value,
  prefix = "",
  highlight,
}) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 py-3 px-2">
    <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    <div className={`text-lg font-bold font-mono-data ${highlight ? "text-rose-600" : "text-slate-900"}`}>
      {prefix}
      {value}
    </div>
  </div>
);
