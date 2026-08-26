"use client";

import React from "react";
import { CalendarCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataGrid, type Column } from "@/components/ui/DataGrid";
import { useAuth } from "@/app/hooks/useAuth";
import { useStudentAttendance } from "@/app/hooks/useStudentAttendance";

export interface MyAttendanceViewProps {
  title: string;
  subtitle: string;
}

type Row = { _id: string; date: string; status: string; remarks: string };

const STATUS_VARIANT: Record<string, "success" | "danger" | "warning" | "info"> = {
  present: "success",
  absent: "danger",
  late: "warning",
  excused: "info",
};

export const MyAttendanceView: React.FC<MyAttendanceViewProps> = ({ title, subtitle }) => {
  const { user } = useAuth();
  const ctx = user?.studentContext;
  const { records, summary, isLoading } = useStudentAttendance(ctx?.studentId);

  const columns: Column<Row>[] = [
    { key: "date", header: "Date", render: (r) => <span className="text-xs font-mono-data">{r.date}</span> },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={STATUS_VARIANT[r.status] ?? "neutral"} size="sm" dot>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "remarks",
      header: "Remarks",
      render: (r) => <span className="text-xs text-slate-500">{r.remarks || "—"}</span>,
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-[#0D9488]" />
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{subtitle}</p>
        {ctx && (
          <p className="text-xs text-teal-600 mt-1 font-medium">
            {ctx.firstName} {ctx.lastName} · {ctx.className} · {ctx.sectionName}
          </p>
        )}
      </div>

      {!ctx ? (
        <EmptyState
          icon={<CalendarCheck className="w-6 h-6" />}
          title="No student linked"
          description="This account isn't linked to a student yet. Please contact your school administrator."
        />
      ) : (
        <>
          {/* Summary */}
          {summary && summary.total > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              <SummaryTile label="Attendance" value={`${summary.presentRate ?? 0}%`} accent />
              <SummaryTile label="Present" value={summary.present} />
              <SummaryTile label="Absent" value={summary.absent} />
              <SummaryTile label="Late" value={summary.late} />
              <SummaryTile label="Excused" value={summary.excused} />
            </div>
          )}

          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <DataGrid<Row>
              columns={columns}
              data={records as Row[]}
              rowKey={(r) => r._id}
              isLoading={isLoading}
              emptyIcon={<CalendarCheck className="w-6 h-6" />}
              emptyTitle="No attendance yet"
              emptyDescription="Attendance uploaded by teachers will appear here."
            />
          )}
        </>
      )}
    </div>
  );
};

const SummaryTile: React.FC<{ label: string; value: string | number; accent?: boolean }> = ({
  label,
  value,
  accent,
}) => (
  <Card>
    <CardContent className="p-4 text-center">
      <div className="text-[10px] uppercase tracking-wide text-slate-400">{label}</div>
      <div className={`text-xl font-bold ${accent ? "text-[#0D9488]" : "text-slate-900"}`}>
        {value}
      </div>
    </CardContent>
  </Card>
);
