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
  lateFeeAmount?: number;
}

/** Admin fee management: filtered bill/challan list + late fee policy + generate + record payment. */
export function useFees() {
  const { schoolId } = useActiveSchool();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [bills, setBills] = useState<any[]>([]);
  const [lateFeeAmount, setLateFeeAmount] = useState<number>(500);
  const [overdueStudents, setOverdueStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBills = useCallback(async () => {
    setIsLoading(true);
    try {
      const [data, policy] = await Promise.all([
        feesRestApi.getChallans({
          classId: classId || undefined,
          sectionId: sectionId || undefined,
        }),
        feesRestApi.getLateFeePolicy().catch(() => null),
      ]);

      if (policy && typeof policy.lateFeeAmount === "number") {
        setLateFeeAmount(policy.lateFeeAmount);
        setOverdueStudents(Array.isArray(policy.overdueStudents) ? policy.overdueStudents : []);
      }

      if (Array.isArray(data)) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const defaultLateFee = policy?.lateFeeAmount ?? 500;

        const normalized = data.map((b) => {
          const baseAmt = Number(b.baseAmount ?? b.amount ?? b.totalAmount ?? 0);
          const paidAmt = Number(b.paidAmount ?? 0);
          const rawStatus = (b.status || "UNPAID").toLowerCase();
          const dueObj = b.dueDate ? new Date(b.dueDate) : null;
          const isPastDue =
            b.isPastDue !== undefined
              ? Boolean(b.isPastDue)
              : rawStatus !== "paid" && Boolean(dueObj && dueObj < todayStart);
          const configuredFine = Number(b.lateFeeAmount ?? b.fineAmount ?? defaultLateFee);
          const lateFeeApplied = isPastDue ? configuredFine : 0;
          const totalAmt = Number(b.effectiveTotalAmount ?? baseAmt + lateFeeApplied);
          const payableAfterDueDate = Number(b.payableAfterDueDate ?? baseAmt + configuredFine);

          return {
            ...b,
            _id: b.id || b._id,
            id: b.id || b._id,
            studentName: b.student?.fullName || b.studentName || "Student",
            admissionNumber: b.student?.admissionNumber || b.admissionNumber || "",
            rollNumber: b.student?.rollNumber || b.rollNumber || "",
            className: b.student?.class?.name || b.className || "",
            sectionName: b.student?.section?.name || b.sectionName || "",
            baseAmount: baseAmt,
            lateFeeAmount: configuredFine,
            lateFeeApplied,
            isPastDue,
            payableAfterDueDate,
            amount: totalAmt,
            totalAmount: totalAmt,
            paidAmount: paidAmt,
            status: isPastDue && rawStatus === "unpaid" ? "overdue" : rawStatus,
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

  const updateLateFeePolicy = async (newLateFee: number) => {
    const res = await feesRestApi.setLateFeePolicy(newLateFee);
    setLateFeeAmount(newLateFee);
    await fetchBills();
    return res;
  };

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
      lateFeeAmount: args.lateFeeAmount ?? lateFeeAmount,
      fineAmount: args.lateFeeAmount ?? lateFeeAmount,
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
    lateFeeAmount,
    overdueStudents,
    isLoading,
    classId,
    setClassId,
    sectionId,
    setSectionId,
    refetch: fetchBills,
    updateLateFeePolicy,
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
          const todayStart = new Date();
          todayStart.setHours(0, 0, 0, 0);
          setBills(
            data.map((b) => {
              const baseAmt = Number(b.baseAmount ?? b.amount ?? b.totalAmount ?? 0);
              const paidAmt = Number(b.paidAmount ?? 0);
              const rawStatus = (b.status || "UNPAID").toLowerCase();
              const dueObj = b.dueDate ? new Date(b.dueDate) : null;
              const isPastDue =
                b.isPastDue !== undefined
                  ? Boolean(b.isPastDue)
                  : rawStatus !== "paid" && Boolean(dueObj && dueObj < todayStart);
              const configuredFine = Number(b.lateFeeAmount ?? b.fineAmount ?? 500);
              const lateFeeApplied = isPastDue ? configuredFine : 0;
              const totalAmt = Number(b.effectiveTotalAmount ?? baseAmt + lateFeeApplied);
              const payableAfterDueDate = Number(b.payableAfterDueDate ?? baseAmt + configuredFine);

              return {
                ...b,
                _id: b.id || b._id,
                baseAmount: baseAmt,
                lateFeeAmount: configuredFine,
                lateFeeApplied,
                isPastDue,
                payableAfterDueDate,
                totalAmount: totalAmt,
                paidAmount: paidAmt,
                issueDate: b.createdAt
                  ? new Date(b.createdAt).toISOString().split("T")[0]
                  : b.issueDate || "",
                dueDate: b.dueDate
                  ? new Date(b.dueDate).toISOString().split("T")[0]
                  : "",
                status: isPastDue && rawStatus === "unpaid" ? "overdue" : rawStatus,
              };
            })
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
