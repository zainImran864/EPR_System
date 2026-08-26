"use client";

import React from "react";
import Link from "next/link";
import { Wallet, FileText } from "lucide-react";
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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Wallet className="w-5 h-5 text-[#0D9488]" />
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>

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
            const balance = b.totalAmount - b.paidAmount;
            return (
              <Card key={b._id}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
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
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Issued {b.issueDate} · Due {b.dueDate}
                      </p>
                    </div>
                    <Link
                      href={`/print/fee-challan?bill=${b._id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-[#0D9488]" />
                      Challan
                    </Link>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <Stat label="Total" value={b.totalAmount} />
                    <Stat label="Paid" value={b.paidAmount} />
                    <Stat label="Balance" value={balance} highlight={balance > 0} />
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

const Stat: React.FC<{ label: string; value: number; highlight?: boolean }> = ({
  label,
  value,
  highlight,
}) => (
  <div className="rounded-xl bg-slate-50 border border-slate-100 py-3">
    <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
    <div className={`text-lg font-bold ${highlight ? "text-rose-600" : "text-slate-900"}`}>
      {value}
    </div>
  </div>
);
