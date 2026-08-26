"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import type { Id } from "@/convex/_generated/dataModel";
import { feesApi } from "@/app/api/fees";
import { useActiveSchool } from "./useActiveSchool";

export interface FeeHead {
  name: string;
  amount: number;
}

export interface GenerateBillsArgs {
  classId: string;
  sectionId?: string;
  title: string;
  heads: FeeHead[];
  issueDate: string;
  dueDate: string;
}

/** Admin fee management: filtered bill list + generate + record payment. */
export function useFees() {
  const { schoolId } = useActiveSchool();
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");

  const bills = useQuery(
    feesApi.list,
    schoolId
      ? {
          schoolId,
          classId: classId ? (classId as Id<"classes">) : undefined,
          sectionId: sectionId ? (sectionId as Id<"sections">) : undefined,
        }
      : "skip"
  );

  const generateMutation = useMutation(feesApi.generate);
  const paymentMutation = useMutation(feesApi.recordPayment);

  const generateBills = (args: GenerateBillsArgs) =>
    schoolId
      ? generateMutation({
          schoolId,
          ...args,
          classId: args.classId as Id<"classes">,
          sectionId: args.sectionId ? (args.sectionId as Id<"sections">) : undefined,
        })
      : undefined;

  const recordPayment = (billId: string, amount: number) =>
    paymentMutation({ billId: billId as Id<"feeBills">, amount });

  return {
    bills: bills ?? [],
    isLoading: bills === undefined,
    classId,
    setClassId,
    sectionId,
    setSectionId,
    generateBills,
    recordPayment,
  };
}

/** A single student's bills (parent/student view). */
export function useStudentBills(studentId?: string | null) {
  const { schoolId } = useActiveSchool();
  const bills = useQuery(
    feesApi.getStudentBills,
    schoolId && studentId
      ? { schoolId, studentId: studentId as Id<"students"> }
      : "skip"
  );
  return { bills: bills ?? [], isLoading: bills === undefined && Boolean(studentId) };
}
