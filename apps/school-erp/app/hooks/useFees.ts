"use client";

import { useState, useEffect, useCallback } from "react";
import { feesRestApi } from "@/app/api/client";
import { useActiveSchool } from "./useActiveSchool";

export interface FeeHead {
  name: string;
  amount: number;
}

export interface GenerateBillsArgs {
  classId?: string;
  sectionId?: string;
  studentId?: string;
  discountPercentage?: number;
  discountAmount?: number;
  title: string;
  heads?: FeeHead[];
  month?: string;
  academicYear?: string;
  issueDate?: string;
  dueDate: string;
  amount?: number;
}

/** Admin fee management: filtered bill/challan list + generate + record payment. */
export function useFees() {
  const { schoolId } = useActiveSchool();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await feesRestApi.getChallans({
        classId: classId || undefined,
        sectionId: sectionId || undefined,
      });
      if (Array.isArray(data)) {
        const normalized = data.map((b) => {
          const totalAmt = Number(b.amount ?? b.totalAmount ?? 0);
          const paidAmt = Number(b.paidAmount ?? 0);
          return {
            ...b,
            _id: b.id || b._id,
            id: b.id || b._id,
            studentName: b.student?.fullName || b.studentName || "Student",
            admissionNumber: b.student?.admissionNumber || b.admissionNumber || "",
            rollNumber: b.student?.rollNumber || b.rollNumber || "",
            className: b.student?.class?.name || b.className || "",
            sectionName: b.student?.section?.name || b.sectionName || "",
            amount: totalAmt,
            totalAmount: totalAmt,
            paidAmount: paidAmt,
            status: (b.status || "UNPAID").toLowerCase(),
            dueDate: b.dueDate ? new Date(b.dueDate).toISOString().split("T")[0] : "",
          };
        });
        setBills(normalized);
      }
    } catch (e) {
      console.warn("REST fees fetch notice:", e);
    } finally {
      setIsLoading(false);
    }
  }, [classId, sectionId]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills, schoolId]);

  const generateBills = async (args: GenerateBillsArgs) => {
    const totalHeadAmount = (args.heads || []).reduce((sum, h) => sum + h.amount, 0);
    const amount = args.amount || totalHeadAmount || 5000;
    const res = await feesRestApi.generateMonthly({
      classId: args.classId,
      sectionId: args.sectionId,
      studentId: args.studentId,
      discountPercentage: args.discountPercentage,
      discountAmount: args.discountAmount,
      title: args.title,
      month: args.month || new Date().toLocaleString("default", { month: "long" }),
      academicYear: args.academicYear || "2026-2027",
      dueDate: args.dueDate || new Date().toISOString(),
      amount,
      applyStudentDiscounts: true,
    });
    await fetchBills();
    return res;
  };

  const recordPayment = async (billId: string, amount: number) => {
    const res = await feesRestApi.payFee(billId, { paidAmount: amount });
    await fetchBills();
    return res;
  };

  return {
    bills,
    isLoading,
    classId,
    setClassId,
    sectionId,
    setSectionId,
    refetch: fetchBills,
    generateBills,
    recordPayment,
  };
}

/** A single student's bills (parent/student view). */
export function useStudentBills(studentId?: string | null) {
  const { schoolId } = useActiveSchool();
  const [bills, setBills] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    let mounted = true;
    setIsLoading(true);
    feesRestApi
      .getChallans({ studentId })
      .then((data) => {
        if (!mounted) return;
        if (Array.isArray(data)) {
          setBills(
            data.map((b) => ({
              ...b,
              _id: b.id || b._id,
              status: (b.status || "UNPAID").toLowerCase(),
            }))
          );
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [studentId, schoolId]);

  return { bills, isLoading };
}
