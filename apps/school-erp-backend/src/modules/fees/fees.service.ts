import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateChallanDto, PayChallanDto, GenerateBulkChallansDto, SetStudentDiscountDto } from './dto/fees.dto';
import { FeeStatus } from '@prisma/client';

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  async listChallans(
    schoolId: string,
    query: {
      status?: FeeStatus;
      studentId?: string;
      classId?: string;
      month?: string;
    },
  ) {
    const where: any = { schoolId };
    if (query.status) where.status = query.status;
    if (query.studentId) where.studentId = query.studentId;
    if (query.month) where.month = query.month;
    if (query.classId) {
      where.student = { classId: query.classId };
    }

    return this.prisma.feeChallan.findMany({
      where,
      include: {
        student: {
          include: { class: true, section: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getChallanById(schoolId: string, id: string) {
    const challan = await this.prisma.feeChallan.findFirst({
      where: { id, schoolId },
      include: {
        student: {
          include: { class: true, section: true, school: true },
        },
      },
    });

    if (!challan) throw new NotFoundException('Fee challan not found');
    return challan;
  }

  async createChallan(schoolId: string, dto: CreateChallanDto) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const count = await this.prisma.feeChallan.count({ where: { schoolId } });
    const year = new Date().getFullYear();
    const challanNumber = `CH-${year}-${String(count + 1).padStart(5, '0')}`;

    let baseAmount = dto.amount;
    let discountAmount = dto.discountAmount || 0;

    // Apply student's profile discount if not explicitly passed
    if (dto.discountAmount === undefined && student.discountPercentage && student.discountPercentage > 0) {
      discountAmount = (baseAmount * student.discountPercentage) / 100;
    }

    const finalPayable = Math.max(0, baseAmount - discountAmount);

    return this.prisma.feeChallan.create({
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
        fineAmount: dto.fineAmount || 0,
        customNotes: dto.customNotes,
        status: FeeStatus.UNPAID,
      },
      include: { student: { include: { class: true, section: true } } },
    });
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
    if (dto.classId) where.classId = dto.classId;
    if (dto.sectionId) where.sectionId = dto.sectionId;

    const students = await this.prisma.student.findMany({ where });
    const year = new Date().getFullYear();
    let count = await this.prisma.feeChallan.count({ where: { schoolId } });

    const applyDiscounts = dto.applyStudentDiscounts ?? true;

    const created = await this.prisma.$transaction(
      students.map((s) => {
        count++;
        const challanNumber = `CH-${year}-${String(count).padStart(5, '0')}`;

        // Base amount: student's custom monthly fee override or general class fee
        let baseAmount = (s.customMonthlyFee && s.customMonthlyFee > 0) ? s.customMonthlyFee : dto.amount;
        let discountAmount = 0;

        if (applyDiscounts && s.discountPercentage && s.discountPercentage > 0) {
          discountAmount = (baseAmount * s.discountPercentage) / 100;
        }

        const payableAmount = Math.max(0, baseAmount - discountAmount);

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
            status: FeeStatus.UNPAID,
            customNotes: s.discountReason ? `Discount Applied: ${s.discountReason}` : undefined,
          },
        });
      }),
    );

    return {
      success: true,
      count: created.length,
      message: `Generated ${created.length} fee challans successfully with student-wise custom fee/discount policies.`,
    };
  }

  async payChallan(schoolId: string, id: string, dto: PayChallanDto) {
    const challan = await this.prisma.feeChallan.findFirst({
      where: { id, schoolId },
    });
    if (!challan) throw new NotFoundException('Fee challan not found');

    const totalDue = challan.amount + challan.fineAmount;
    const newPaidAmount = challan.paidAmount + dto.paidAmount;

    let status: FeeStatus = FeeStatus.PARTIAL;
    if (newPaidAmount >= totalDue) {
      status = FeeStatus.PAID;
    }

    return this.prisma.feeChallan.update({
      where: { id },
      data: {
        paidAmount: newPaidAmount,
        status,
        paymentDate: new Date(),
        paymentMethod: dto.paymentMethod || 'Cash',
      },
    });
  }

  async getStudentLedger(schoolId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { class: true, section: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const challans = await this.prisma.feeChallan.findMany({
      where: { schoolId, studentId },
      orderBy: { createdAt: 'desc' },
    });

    const totalBilled = challans.reduce((sum, c) => sum + c.amount + c.fineAmount, 0);
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
