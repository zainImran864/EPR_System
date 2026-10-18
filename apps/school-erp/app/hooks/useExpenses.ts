"use client";

import { useState, useEffect, useCallback } from "react";
import { expensesRestApi } from "@/app/api/client";
import { useToast } from "@/app/hooks/useToast";

export interface ExpenseItem {
  id: string;
  voucherNumber: string;
  title: string;
  category: string;
  amount: number;
  expenseDate: string;
  month: string;
  academicYear: string;
  paymentMethod: string;
  recipientName?: string;
  invoiceNumber?: string;
  receiptUrl?: string;
  remarks?: string;
  createdAt: string;
}

export interface FinancialTrackingData {
  periodLabel: string;
  rangeType: "monthly" | "yearly" | "custom";
  startDate: string;
  endDate: string;
  summary: {
    totalFeesBilled: number;
    totalFeesCollected: number;
    totalFeesPending: number;
    totalExpenses: number;
    netProfitLoss: number;
    isProfitable: boolean;
    profitMarginPercent: number;
    expenseCount: number;
    feeChallanCount: number;
  };
  categoryBreakdown: Array<{
    category: string;
    label: string;
    total: number;
    count: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    feesCollected: number;
    expenses: number;
    netProfit: number;
  }>;
  recentExpenses: ExpenseItem[];
}

export function useExpenses() {
  const { success, error: toastError } = useToast();

  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Financial Tracking State
  const [tracking, setTracking] = useState<FinancialTrackingData | null>(null);
  const [trackingLoading, setTrackingLoading] = useState<boolean>(true);

  const fetchExpenses = useCallback(
    async (query?: {
      month?: string;
      category?: string;
      startDate?: string;
      endDate?: string;
      academicYear?: string;
    }) => {
      setLoading(true);
      try {
        const res = await expensesRestApi.getAll(query);
        if (res) {
          setExpenses(res.expenses || []);
          setTotalAmount(res.totalAmount || 0);
          setCount(res.count || 0);
        }
      } catch (err: any) {
        console.error("Failed to load expenses:", err);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const fetchTracking = useCallback(
    async (query?: {
      rangeType?: "monthly" | "yearly" | "custom";
      month?: string;
      year?: string;
      startDate?: string;
      endDate?: string;
    }) => {
      setTrackingLoading(true);
      try {
        const data = await expensesRestApi.getTracking(query);
        setTracking(data);
      } catch (err: any) {
        console.error("Failed to load financial tracking:", err);
      } finally {
        setTrackingLoading(false);
      }
    },
    []
  );

  const createExpense = async (data: {
    title: string;
    category: string;
    amount: number;
    expenseDate?: string;
    month?: string;
    academicYear?: string;
    paymentMethod?: string;
    recipientName?: string;
    invoiceNumber?: string;
    receiptUrl?: string;
    remarks?: string;
  }) => {
    try {
      const created = await expensesRestApi.create(data);
      success("Expense voucher recorded successfully!", { title: "Expense Added" });
      await fetchExpenses();
      await fetchTracking();
      return created;
    } catch (err: any) {
      const msg = err?.message || "Failed to record expense voucher";
      toastError(msg);
      throw err;
    }
  };

  const updateExpense = async (id: string, data: any) => {
    try {
      const updated = await expensesRestApi.update(id, data);
      success("Expense updated successfully!");
      await fetchExpenses();
      await fetchTracking();
      return updated;
    } catch (err: any) {
      toastError(err?.message || "Failed to update expense");
      throw err;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      await expensesRestApi.delete(id);
      success("Expense voucher deleted.");
      await fetchExpenses();
      await fetchTracking();
    } catch (err: any) {
      toastError(err?.message || "Failed to delete expense");
      throw err;
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchTracking();
  }, [fetchExpenses, fetchTracking]);

  return {
    expenses,
    totalAmount,
    count,
    loading,
    tracking,
    trackingLoading,
    fetchExpenses,
    fetchTracking,
    createExpense,
    updateExpense,
    deleteExpense,
  };
}
