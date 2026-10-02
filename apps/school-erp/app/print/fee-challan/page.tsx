"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Printer, ArrowLeft } from "lucide-react";
import { feesRestApi } from "@/app/api/client";
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
  const { school } = useActiveSchool();
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    feesRestApi
      .getChallans({ id: billId })
      .then((res) => {
        if (!mounted) return;
        const item = Array.isArray(res) ? res[0] : res;
        if (item) {
          setData({
            school: {
              name: school?.name || "Oakridge International School",
              address: school?.address || "123 Education Lane",
              phone: school?.phone || "+1 (555) 234-5678",
              logoUrl: school?.logoUrl,
            },
            student: item.student || {
              firstName: item.studentName || "Student",
              lastName: "",
              rollNumber: item.rollNumber || "",
              className: item.className || "",
              sectionName: item.sectionName || "",
            },
            bill: {
              _id: item.id || item._id,
              challanNumber: item.challanNumber || `CHL-${item.id?.slice(0, 6) || "001"}`,
              title: item.title || "Monthly Tuition Fee",
              month: item.month || "October",
              academicYear: item.academicYear || "2024-2025",
              issueDate: item.createdAt || new Date().toISOString(),
              dueDate: item.dueDate || new Date().toISOString(),
              totalAmount: item.amount || 0,
              paidAmount: item.paidAmount || 0,
              status: item.status || "UNPAID",
              heads: item.heads || [{ name: "Tuition Fee", amount: item.amount || 0 }],
            },
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [billId, school]);

  if (isLoading) return <Centered><Spinner size="lg" /></Centered>;
  if (!data) return <Centered>Challan not found.</Centered>;
  return <FeeChallanSheet data={data as ChallanData} lastPage />;
}

function BulkChallans({ classId, sectionId }: { classId: string; sectionId: string }) {
  const { school } = useActiveSchool();
  const [challans, setChallans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    feesRestApi
      .getChallans({ classId, sectionId })
      .then((res) => {
        if (!mounted) return;
        if (Array.isArray(res)) setChallans(res);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [classId, sectionId]);

  if (isLoading) return <Centered><Spinner size="lg" /></Centered>;
  if (challans.length === 0)
    return <Centered>No bills found for this section.</Centered>;

  return (
    <>
      {challans.map((c, i) => (
        <FeeChallanSheet
          key={c.id || c._id}
          data={{
            school: {
              name: school?.name || "Oakridge International School",
              address: school?.address || "123 Education Lane",
              phone: school?.phone || "+1 (555) 234-5678",
              logoUrl: school?.logoUrl,
            },
            student: c.student
              ? { ...c.student, className: c.student?.class?.name, sectionName: c.student?.section?.name }
              : null,
            bill: {
              _id: c.id || c._id,
              challanNumber: c.challanNumber || `CHL-${c.id?.slice(0, 6) || "001"}`,
              title: c.title || "Monthly Tuition Fee",
              month: c.month || "October",
              academicYear: c.academicYear || "2024-2025",
              issueDate: c.createdAt || new Date().toISOString(),
              dueDate: c.dueDate || new Date().toISOString(),
              totalAmount: c.amount || 0,
              paidAmount: c.paidAmount || 0,
              status: c.status || "UNPAID",
              heads: c.heads || [{ name: "Tuition Fee", amount: c.amount || 0 }],
            },
          }}
          lastPage={i === challans.length - 1}
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
