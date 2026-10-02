"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { Printer, ArrowLeft } from "lucide-react";
import { feesApi } from "@/app/api/fees";
import { useActiveSchool } from "@/app/hooks/useActiveSchool";
import { FeeChallanSheet, type ChallanData } from "@/components/print/FeeChallanSheet";
import { Spinner } from "@/components/ui/Spinner";

function Toolbar() {
  return (
    <div className="no-print sticky top-0 z-10 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-xs font-medium text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0D9488] text-white text-xs font-semibold hover:bg-[#0B7A70] transition-colors"
      >
        <Printer className="w-4 h-4" />
        Print / Save as PDF
      </button>
    </div>
  );
}

function PrintStyles() {
  return (
    <style jsx global>{`
      @media print {
        .no-print {
          display: none !important;
        }
        @page {
          size: A4;
          margin: 0;
        }
      }
    `}</style>
  );
}

function SingleChallan({ billId }: { billId: string }) {
  const data = useQuery(feesApi.getChallan, { billId: billId as Id<"feeBills"> });
  if (data === undefined)
    return <Centered><Spinner size="lg" /></Centered>;
  if (!data) return <Centered>Challan not found.</Centered>;
  return <FeeChallanSheet data={data as ChallanData} lastPage />;
}

function BulkChallans({ classId, sectionId }: { classId: string; sectionId: string }) {
  const { schoolId } = useActiveSchool();
  const data = useQuery(
    feesApi.getSectionChallans,
    schoolId
      ? {
          schoolId,
          classId: classId as Id<"classes">,
          sectionId: sectionId as Id<"sections">,
        }
      : "skip"
  );
  if (data === undefined) return <Centered><Spinner size="lg" /></Centered>;
  if (!data || data.challans.length === 0)
    return <Centered>No bills found for this section.</Centered>;

  return (
    <>
      {data.challans.map((c, i) => (
        <FeeChallanSheet
          key={c.bill._id}
          data={{
            school: data.school,
            student: c.student
              ? { ...c.student, className: data.className, sectionName: data.sectionName }
              : null,
            bill: c.bill,
          }}
          lastPage={i === data.challans.length - 1}
        />
      ))}
    </>
  );
}

const Centered: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
    {children}
  </div>
);

function ChallanInner() {
  const params = useSearchParams();
  const billId = params.get("bill");
  const sectionId = params.get("section");
  const classId = params.get("class");

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <Toolbar />
      {billId ? (
        <SingleChallan billId={billId} />
      ) : sectionId && classId ? (
        <BulkChallans classId={classId} sectionId={sectionId} />
      ) : (
        <Centered>No challan selected.</Centered>
      )}
      <PrintStyles />
    </div>
  );
}

export default function FeeChallanPrintPage() {
  return (
    <Suspense fallback={<Centered><Spinner size="lg" /></Centered>}>
      <ChallanInner />
    </Suspense>
  );
}
