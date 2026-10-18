import { Injectable, NotFoundException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateChallanDto, PayChallanDto, GenerateBulkChallansDto, SetStudentDiscountDto, SetLateFeePolicyDto } from './dto/fees.dto';
import { FeeStatus } from '@prisma/client';

@Injectable()
export class FeesService {
  private readonly logger = new Logger(FeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    @Optional() private readonly notificationsService?: NotificationsService,
  ) {}

  private memoryStructures: Record<string, any[]> = {};
  private schoolLateFeePolicy: Record<string, number> = {};
  private notifiedOverdueChallans = new Set<string>();

  getSchoolLateFeeAmount(schoolId: string): number {
    return this.schoolLateFeePolicy[schoolId] ?? 500;
  }

  async getLateFeePolicy(schoolId: string) {
    const lateFeeAmount = this.getSchoolLateFeeAmount(schoolId);
    const overdueInfo = await this.evaluateOverdueChallans(schoolId);
    return {
      schoolId,
      lateFeeAmount,
      overdueCount: overdueInfo.overdueChallans.length,
      overdueStudents: overdueInfo.overdueChallans.map((c) => ({
        challanId: c.id,
        challanNumber: c.challanNumber,
        studentId: c.studentId,
        studentName: c.student?.fullName || 'Student',
        admissionNumber: c.student?.admissionNumber || '',
        className: c.student?.class?.name || '',
        sectionName: c.student?.section?.name || '',
        title: c.title,
        dueDate: c.dueDate,
        baseAmount: c.amount,
        lateFeeIncrement: c.lateFeeAmount,
        totalPayable: c.effectiveTotalAmount,
      })),
    };
  }

  async setLateFeePolicy(schoolId: string, dto: SetLateFeePolicyDto) {
    const amount = Math.max(0, Number(dto.lateFeeAmount) || 0);
    this.schoolLateFeePolicy[schoolId] = amount;

    // Update unpaid/overdue challans in this school so they reflect the configured late fee increment
    await this.prisma.feeChallan.updateMany({
      where: {
        schoolId,
        status: { in: [FeeStatus.UNPAID, FeeStatus.OVERDUE, FeeStatus.PARTIAL] },
      },
      data: {
        fineAmount: amount,
      },
    });

    const policy = await this.getLateFeePolicy(schoolId);
    return {
      ...policy,
      message: `Late fee increment after due date updated to ${amount}.`,
    };
  }

  private enrichChallan(c: any, schoolId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const due = c.dueDate ? new Date(c.dueDate) : new Date();
    const isPastDue = c.status !== FeeStatus.PAID && due < todayStart;
    const configuredLateFee =
      c.fineAmount != null && c.fineAmount > 0
        ? Number(c.fineAmount)
        : this.getSchoolLateFeeAmount(schoolId);
    const lateFeeApplied = isPastDue ? configuredLateFee : 0;
    const baseAmount = Number(c.amount || 0);
    const effectiveTotalAmount = baseAmount + lateFeeApplied;
    const payableAfterDueDate = baseAmount + configuredLateFee;

    const heads: Array<{ name: string; amount: number }> = [
      { name: c.title || 'Tuition Fee', amount: baseAmount },
    ];
    if (isPastDue && configuredLateFee > 0) {
      heads.push({
        name: 'Late Fee Increment (After Due Date)',
        amount: configuredLateFee,
      });
    }

    return {
      ...c,
      baseAmount,
      lateFeeAmount: configuredLateFee,
      lateFeeApplied,
      isPastDue,
      payableAfterDueDate,
      effectiveTotalAmount,
      status: isPastDue && c.status === FeeStatus.UNPAID ? FeeStatus.OVERDUE : c.status,
      heads,
    };
  }

  async evaluateOverdueChallans(schoolId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const defaultLateFee = this.getSchoolLateFeeAmount(schoolId);

    const overdueRaw = await this.prisma.feeChallan.findMany({
      where: {
        schoolId,
        status: { in: [FeeStatus.UNPAID, FeeStatus.OVERDUE, FeeStatus.PARTIAL] },
        dueDate: { lt: todayStart },
      },
      include: {
        student: {
          include: { class: true, section: true, parent: true },
        },
      },
      orderBy: { dueDate: 'asc' },
    });

    const enrichedOverdue: any[] = [];

    for (const ch of overdueRaw) {
      const fineToApply = ch.fineAmount > 0 ? ch.fineAmount : defaultLateFee;
      const nextStatus = ch.status === FeeStatus.UNPAID ? FeeStatus.OVERDUE : ch.status;

      if (ch.status !== nextStatus || ch.fineAmount !== fineToApply) {
        await this.prisma.feeChallan
          .update({
            where: { id: ch.id },
            data: {
              status: nextStatus,
              fineAmount: fineToApply,
            },
          })
          .catch(() => null);
        ch.status = nextStatus;
        ch.fineAmount = fineToApply;
      }

      const enriched = this.enrichChallan(ch, schoolId);
      enrichedOverdue.push(enriched);

      // Dispatch notifications to Admin and Parent/Student once per overdue challan
      if (!this.notifiedOverdueChallans.has(ch.id) && this.notificationsService) {
        this.notifiedOverdueChallans.add(ch.id);
        const studentName = ch.student?.fullName || 'Student';
        const admNo = ch.student?.admissionNumber || '';
        const classLabel = ch.student?.class?.name
          ? `${ch.student.class.name}${ch.student?.section?.name ? ` (${ch.student.section.name})` : ''}`
          : '';
        const dueStr = new Date(ch.dueDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });

        await this.notificationsService
          .createNotification(schoolId, {
            title: `Overdue Fee Alert: ${studentName}`,
            message: `Student ${studentName} (${admNo}${classLabel ? `, ${classLabel}` : ''}) has passed the fee due date (${dueStr}) for "${ch.title}". Late fee increment of +${fineToApply} has been added (New Payable: ${ch.amount + fineToApply}).`,
            type: 'warning',
            targetRole: 'ADMIN',
          })
          .catch(() => null);

        await this.notificationsService
          .createNotification(schoolId, {
            title: `Fee Due Date Passed — Late Fee Increment Added`,
            message: `Dear Parent, the due date (${dueStr}) for ${studentName}'s fee ("${ch.title}") has passed. A late fee increment of +${fineToApply} has been added to the fee card (Payable After Due Date: ${ch.amount + fineToApply}).`,
            type: 'warning',
            targetRole: 'PARENT',
            targetUserId: ch.student?.parent?.userId || undefined,
          })
          .catch(() => null);

        if (ch.student?.userId) {
          await this.notificationsService
            .createNotification(schoolId, {
              title: `Fee Due Date Passed — Late Fee Increment Added`,
              message: `The due date (${dueStr}) for "${ch.title}" has passed. A late fee increment of +${fineToApply} has been applied (Payable After Due Date: ${ch.amount + fineToApply}).`,
              type: 'warning',
              targetRole: 'STUDENT',
              targetUserId: ch.student.userId,
            })
            .catch(() => null);
        }
      }
    }

    return {
      overdueCount: enrichedOverdue.length,
      lateFeeAmount: defaultLateFee,
      overdueChallans: enrichedOverdue,
    };
  }

  async listStructures(schoolId: string) {
    if (this.memoryStructures[schoolId]?.length) {
      return this.memoryStructures[schoolId];
    }
    const classes = await this.prisma.class.findMany({
      where: { schoolId },
      orderBy: { grade: 'asc' },
    });
    return classes.map((c) => ({
      id: `fs_${c.id}`,
      classId: c.id,
      className: c.name,
      tuitionFee: 5000 + c.grade * 500,
      labFee: c.grade >= 9 ? 1500 : 500,
      examFee: 1000,
      academicYear: '2026-2027',
    }));
  }

  async saveStructure(schoolId: string, body: any) {
    const list = await this.listStructures(schoolId);
    const entry = {
      id: body.id || `fs_${Date.now()}`,
      ...body,
      schoolId,
    };
    const idx = list.findIndex((x) => x.classId === body.classId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...entry };
    } else {
      list.push(entry);
    }
    this.memoryStructures[schoolId] = list;
    return entry;
  }

  async listChallans(
    schoolId: string,
    query: {
      status?: FeeStatus;
      studentId?: string;
      classId?: string;
      sectionId?: string;
      month?: string;
    },
  ) {
    // Evaluate overdue due dates & dispatch Admin/Parent notifications automatically
    await this.evaluateOverdueChallans(schoolId).catch(() => null);

    const where: any = { schoolId };
    if (query.status) where.status = query.status;
    if (query.studentId) where.studentId = query.studentId;
    if (query.month) where.month = query.month;
    if (query.classId || query.sectionId) {
      where.student = {};
      if (query.classId) where.student.classId = query.classId;
      if (query.sectionId) where.student.sectionId = query.sectionId;
    }

    const challans = await this.prisma.feeChallan.findMany({
      where,
      include: {
        student: {
          include: { class: true, section: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return challans.map((c) => this.enrichChallan(c, schoolId));
  }

  async getChallanById(schoolId: string, id: string) {
    await this.evaluateOverdueChallans(schoolId).catch(() => null);

    const challan = await this.prisma.feeChallan.findFirst({
      where: { id, schoolId },
      include: {
        student: {
          include: { class: true, section: true, school: true },
        },
      },
    });

    if (!challan) throw new NotFoundException('Fee challan not found');
    return this.enrichChallan(challan, schoolId);
  }

  async createChallan(schoolId: string, dto: CreateChallanDto) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const count = await this.prisma.feeChallan.count({ where: { schoolId } });
    const year = new Date().getFullYear();
    const challanNumber = `CH-${year}-${String(count + 1).padStart(5, '0')}`;

    const baseAmount = dto.amount;
    let discountAmount = dto.discountAmount || 0;

    // Apply student's profile discount if not explicitly passed
    if (dto.discountAmount === undefined && student.discountPercentage && student.discountPercentage > 0) {
      discountAmount = (baseAmount * student.discountPercentage) / 100;
    }

    const finalPayable = Math.max(0, baseAmount - discountAmount);
    const configuredFine =
      dto.fineAmount ?? dto.lateFeeAmount ?? this.getSchoolLateFeeAmount(schoolId);
    if (dto.lateFeeAmount !== undefined && dto.lateFeeAmount >= 0) {
      this.schoolLateFeePolicy[schoolId] = dto.lateFeeAmount;
    }

    const createdChallan = await this.prisma.feeChallan.create({
      data: {
        schoolId,
        studentId: dto.studentId,
        challanNumber,
        title: dto.title,
        month: dto.month,
        academicYear: dto.academicYear,
        dueDate: new Date(dto.dueDate),
        amount: finalPayable,
        discountAmount,
        fineAmount: configuredFine,
        customNotes: dto.customNotes,
        status: FeeStatus.UNPAID,
      },
      include: { student: { include: { class: true, section: true } } },
    });

    await this.evaluateOverdueChallans(schoolId).catch(() => null);
    await this.redisService.del(`dashboard:stats:${schoolId}`);
    return this.enrichChallan(createdChallan, schoolId);
  }

  async setStudentDiscount(schoolId: string, studentId: string, dto: SetStudentDiscountDto) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.student.update({
      where: { id: studentId },
      data: {
        discountPercentage: dto.discountPercentage !== undefined ? dto.discountPercentage : student.discountPercentage,
        customMonthlyFee: dto.customMonthlyFee !== undefined ? dto.customMonthlyFee : student.customMonthlyFee,
        discountReason: dto.discountReason !== undefined ? dto.discountReason : student.discountReason,
      },
      include: { class: true, section: true },
    });
  }

  async generateBulkChallans(schoolId: string, dto: GenerateBulkChallansDto) {
    const where: any = { schoolId, status: 'active' };
    if (dto.studentId) {
      where.id = dto.studentId;
    } else {
      if (dto.classId) where.classId = dto.classId;
      if (dto.sectionId) where.sectionId = dto.sectionId;
    }

    const students = await this.prisma.student.findMany({ where });
    if (students.length === 0) {
      throw new NotFoundException('No active students found matching the selected criteria.');
    }

    const year = new Date().getFullYear();
    let count = await this.prisma.feeChallan.count({ where: { schoolId } });

    const applyDiscounts = dto.applyStudentDiscounts ?? true;
    const configuredFine =
      dto.fineAmount ?? dto.lateFeeAmount ?? this.getSchoolLateFeeAmount(schoolId);
    if (dto.lateFeeAmount !== undefined && dto.lateFeeAmount >= 0) {
      this.schoolLateFeePolicy[schoolId] = dto.lateFeeAmount;
    }

    const created = await this.prisma.$transaction(
      students.map((s) => {
        count++;
        const challanNumber = `CH-${year}-${String(count).padStart(5, '0')}`;

        // Base amount: student's custom monthly fee override or general class fee
        const baseAmount = (s.customMonthlyFee && s.customMonthlyFee > 0) ? s.customMonthlyFee : dto.amount;
        let discountAmount = 0;

        if (dto.discountAmount !== undefined && dto.discountAmount > 0) {
          discountAmount = dto.discountAmount;
        } else if (dto.discountPercentage !== undefined && dto.discountPercentage > 0) {
          discountAmount = (baseAmount * dto.discountPercentage) / 100;
        } else if (applyDiscounts && s.discountPercentage && s.discountPercentage > 0) {
          discountAmount = (baseAmount * s.discountPercentage) / 100;
        }

        const payableAmount = Math.max(0, baseAmount - discountAmount);
        const discountNote = dto.discountPercentage || dto.discountAmount
          ? `Custom Discount Applied: ${dto.discountPercentage ? `${dto.discountPercentage}%` : `Rs. ${dto.discountAmount}`}`
          : (s.discountReason ? `Discount Applied: ${s.discountReason}` : undefined);

        return this.prisma.feeChallan.create({
          data: {
            schoolId,
            studentId: s.id,
            challanNumber,
            title: dto.title,
            month: dto.month,
            academicYear: dto.academicYear,
            dueDate: new Date(dto.dueDate),
            amount: payableAmount,
            discountAmount,
            fineAmount: configuredFine,
            status: FeeStatus.UNPAID,
            customNotes: discountNote,
          },
        });
      }),
    );

    await this.evaluateOverdueChallans(schoolId).catch(() => null);
    await this.redisService.del(`dashboard:stats:${schoolId}`);

    return {
      success: true,
      count: created.length,
      lateFeeAmount: configuredFine,
      message: `Generated ${created.length} fee challans successfully with late fee policy (+${configuredFine} after due date).`,
    };
  }

  async payChallan(schoolId: string, id: string, dto: PayChallanDto) {
    const challan = await this.prisma.feeChallan.findFirst({
      where: { id, schoolId },
    });
    if (!challan) throw new NotFoundException('Fee challan not found');

    const enriched = this.enrichChallan(challan, schoolId);
    const totalDue = enriched.effectiveTotalAmount;
    const newPaidAmount = challan.paidAmount + dto.paidAmount;

    let status: FeeStatus = FeeStatus.PARTIAL;
    if (newPaidAmount >= totalDue) {
      status = FeeStatus.PAID;
    }

    const updated = await this.prisma.feeChallan.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status,
        paymentDate: new Date(),
        paymentMethod: dto.paymentMethod || 'Cash',
      },
    });

    await this.redisService.del(`dashboard:stats:${schoolId}`);
    return this.enrichChallan(updated, schoolId);
  }

  async getStudentLedger(schoolId: string, studentId: string) {
    await this.evaluateOverdueChallans(schoolId).catch(() => null);

    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { class: true, section: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const rawChallans = await this.prisma.feeChallan.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: 'desc' },
    });

    const challans = rawChallans.map((c) => this.enrichChallan(c, schoolId));
    const totalBilled = challans.reduce((sum, c) => sum + c.effectiveTotalAmount, 0);
    const totalPaid = challans.reduce((sum, c) => sum + c.paidAmount, 0);
    const totalPending = totalBilled - totalPaid;

    return {
      student,
      summary: {
        totalBilled,
        totalPaid,
        totalPending,
        totalChallans: challans.length,
      },
      challans,
    };
  }
}
