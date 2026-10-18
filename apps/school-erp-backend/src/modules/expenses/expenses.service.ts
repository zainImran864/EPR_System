import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryDto,
  TrackingQueryDto,
} from './dto/expense.dto';
import { ExpenseCategory, FeeStatus } from '@prisma/client';

@Injectable()
export class ExpensesService {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createExpense(schoolId: string, userId: string, dto: CreateExpenseDto) {
    const expenseDate = dto.expenseDate ? new Date(dto.expenseDate) : new Date();
    const month =
      dto.month ||
      expenseDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    const count = await this.prisma.read.expense.count({ where: { schoolId } });
    const voucherNumber = `EXP-${expenseDate.getFullYear()}${String(
      expenseDate.getMonth() + 1,
    ).padStart(2, '0')}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.expense.create({
      data: {
        schoolId,
        voucherNumber,
        title: dto.title,
        category: dto.category,
        amount: Number(dto.amount),
        expenseDate,
        month,
        academicYear: dto.academicYear || '2026-2027',
        paymentMethod: dto.paymentMethod || 'Cash',
        recipientName: dto.recipientName,
        invoiceNumber: dto.invoiceNumber,
        receiptUrl: dto.receiptUrl,
        remarks: dto.remarks,
        recordedBy: userId,
      },
    });
  }

  async listExpenses(schoolId: string, query: ExpenseQueryDto) {
    const where: any = { schoolId };

    if (query.category) {
      where.category = query.category as ExpenseCategory;
    }

    if (query.month) {
      where.month = { contains: query.month, mode: 'insensitive' };
    }

    if (query.academicYear) {
      where.academicYear = query.academicYear;
    }

    if (query.startDate || query.endDate) {
      where.expenseDate = {};
      if (query.startDate) {
        where.expenseDate.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        const end = new Date(query.endDate);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    const expenses = await this.prisma.read.expense.findMany({
      where,
      orderBy: { expenseDate: 'desc' },
    });

    const totalAmount = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

    return {
      expenses,
      totalAmount: Math.round(totalAmount * 100) / 100,
      count: expenses.length,
    };
  }

  async getExpenseById(schoolId: string, id: string) {
    const expense = await this.prisma.read.expense.findFirst({
      where: { id, schoolId },
    });
    if (!expense) throw new NotFoundException('Expense voucher not found');
    return expense;
  }

  async updateExpense(schoolId: string, id: string, dto: UpdateExpenseDto) {
    await this.getExpenseById(schoolId, id);

    const data: any = { ...dto };
    if (dto.expenseDate) {
      data.expenseDate = new Date(dto.expenseDate);
    }
    if (dto.amount !== undefined) {
      data.amount = Number(dto.amount);
    }

    return this.prisma.expense.update({
      where: { id },
      data,
    });
  }

  async deleteExpense(schoolId: string, id: string) {
    await this.getExpenseById(schoolId, id);
    return this.prisma.expense.delete({ where: { id } });
  }

  /**
   * Financial Tracking: Fees Collection (Revenue) vs Expenses = Net Profit / Loss
   * Supports Range Filters:
   * 1. Monthly (e.g. October 2026)
   * 2. Yearly (e.g. 2026 or academic year 2026-2027)
   * 3. Custom Date Range (startDate -> endDate)
   */
  async getFinancialTracking(schoolId: string, query: TrackingQueryDto) {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;
    let periodLabel: string;

    const rangeType = query.rangeType || 'monthly';

    if (rangeType === 'custom' && query.startDate && query.endDate) {
      startDate = new Date(query.startDate);
      endDate = new Date(query.endDate);
      endDate.setHours(23, 59, 59, 999);
      periodLabel = `${query.startDate} to ${query.endDate}`;
    } else if (rangeType === 'yearly') {
      const yearStr = query.year || String(now.getFullYear());
      if (yearStr.includes('-')) {
        // Academic year like "2026-2027"
        const startY = parseInt(yearStr.split('-')[0], 10);
        startDate = new Date(startY, 7, 1); // Aug 1
        endDate = new Date(startY + 1, 6, 31, 23, 59, 59, 999); // Jul 31 next year
      } else {
        const y = parseInt(yearStr, 10);
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59, 999);
      }
      periodLabel = `Year ${yearStr}`;
    } else {
      // Monthly
      const targetMonthStr =
        query.month || now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const [mName, yStr] = targetMonthStr.split(' ');
      const year = yStr ? parseInt(yStr, 10) : now.getFullYear();
      const monthIndex = mName
        ? new Date(`${mName} 1, 2000`).getMonth()
        : now.getMonth();
      startDate = new Date(year, monthIndex, 1);
      endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
      periodLabel = targetMonthStr;
    }

    // 1. Fetch Fees Collection for the period
    const feeChallans = await this.prisma.read.feeChallan.findMany({
      where: {
        schoolId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true,
        amount: true,
        paidAmount: true,
        fineAmount: true,
        discountAmount: true,
        status: true,
        paymentDate: true,
        createdAt: true,
        challanNumber: true,
        student: { select: { fullName: true } },
      },
    });

    const totalFeesBilled = feeChallans.reduce((sum, c) => sum + (c.amount || 0), 0);
    const totalFeesCollected = feeChallans.reduce((sum, c) => sum + (c.paidAmount || 0), 0);
    const totalFeesPending = feeChallans
      .filter((c) => c.status === FeeStatus.UNPAID || c.status === FeeStatus.OVERDUE)
      .reduce((sum, c) => sum + Math.max(0, (c.amount || 0) - (c.paidAmount || 0)), 0);

    // 2. Fetch School Expenses for the period
    const expenses = await this.prisma.read.expense.findMany({
      where: {
        schoolId,
        expenseDate: { gte: startDate, lte: endDate },
      },
      orderBy: { expenseDate: 'desc' },
    });

    const totalExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netProfitLoss = totalFeesCollected - totalExpenses;
    const profitMarginPercent =
      totalFeesCollected > 0
        ? Math.round(((netProfitLoss / totalFeesCollected) * 100) * 10) / 10
        : 0;

    // 3. Category Breakdown of Expenses
    const categoryTotals: Record<string, { total: number; count: number }> = {};
    for (const cat of Object.values(ExpenseCategory)) {
      categoryTotals[cat] = { total: 0, count: 0 };
    }

    for (const exp of expenses) {
      if (!categoryTotals[exp.category]) {
        categoryTotals[exp.category] = { total: 0, count: 0 };
      }
      categoryTotals[exp.category].total += exp.amount || 0;
      categoryTotals[exp.category].count += 1;
    }

    const categoryBreakdown = Object.entries(categoryTotals).map(([cat, val]) => ({
      category: cat,
      label: formatCategoryLabel(cat),
      total: Math.round(val.total * 100) / 100,
      count: val.count,
      percentage:
        totalExpenses > 0
          ? Math.round(((val.total / totalExpenses) * 100) * 10) / 10
          : 0,
    }));

    // 4. Monthly Trend (Past 6 Months)
    const monthlyTrend = await this.computePast6MonthsTrend(schoolId);

    return {
      periodLabel,
      rangeType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      summary: {
        totalFeesBilled: Math.round(totalFeesBilled * 100) / 100,
        totalFeesCollected: Math.round(totalFeesCollected * 100) / 100,
        totalFeesPending: Math.round(totalFeesPending * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netProfitLoss: Math.round(netProfitLoss * 100) / 100,
        isProfitable: netProfitLoss >= 0,
        profitMarginPercent,
        expenseCount: expenses.length,
        feeChallanCount: feeChallans.length,
      },
      categoryBreakdown,
      monthlyTrend,
      recentExpenses: expenses.slice(0, 10),
    };
  }

  private async computePast6MonthsTrend(schoolId: string) {
    const trend = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthName = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

      const [feeAgg, expAgg] = await Promise.all([
        this.prisma.read.feeChallan.aggregate({
          where: {
            schoolId,
            createdAt: { gte: mStart, lte: mEnd },
          },
          _sum: { paidAmount: true },
        }),
        this.prisma.read.expense.aggregate({
          where: {
            schoolId,
            expenseDate: { gte: mStart, lte: mEnd },
          },
          _sum: { amount: true },
        }),
      ]);

      const feesCollected = Math.round((feeAgg._sum.paidAmount || 0) * 100) / 100;
      const expenses = Math.round((expAgg._sum.amount || 0) * 100) / 100;
      const netProfit = Math.round((feesCollected - expenses) * 100) / 100;

      trend.push({
        month: monthName,
        feesCollected,
        expenses,
        netProfit,
      });
    }

    return trend;
  }
}

function formatCategoryLabel(cat: string): string {
  switch (cat) {
    case 'UTILITIES':
      return 'Utility Bills (Electric, Water, Gas, Net)';
    case 'SALARIES':
      return 'Teachers & Staff Salaries';
    case 'STATIONERY_PAPER':
      return 'Paper & Printing Bills, Stationery';
    case 'MAINTENANCE':
      return 'Building Repairs & Maintenance';
    case 'RENT':
      return 'Campus Rent';
    case 'EVENTS':
      return 'Events, Sports & Functions';
    case 'LAB_LIBRARY':
      return 'Lab Equipment & Library';
    case 'MISCELLANEOUS':
    default:
      return 'Miscellaneous & Operations';
  }
}
