import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateChallanDto, PayChallanDto, GenerateBulkChallansDto } from './dto/fees.dto';
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
    const count = await this.prisma.feeChallan.count({ where: { schoolId } });
    const year = new Date().getFullYear();
    const challanNumber = `CH-${year}-${String(count + 1).padStart(5, '0')}`;

    return this.prisma.feeChallan.create({
      data: {
        schoolId,
        studentId: dto.studentId,
        challanNumber,
        title: dto.title,
        month: dto.month,
        academicYear: dto.academicYear,
        dueDate: new Date(dto.dueDate),
        amount: dto.amount,
        fineAmount: dto.fineAmount || 0,
        status: FeeStatus.UNPAID,
      },
      include: { student: true },
    });
  }

  async generateBulkChallans(schoolId: string, dto: GenerateBulkChallansDto) {
    const where: any = { schoolId, status: 'active' };
    if (dto.classId) where.classId = dto.classId;

    const students = await this.prisma.student.findMany({ where });
    const year = new Date().getFullYear();
    let count = await this.prisma.feeChallan.count({ where: { schoolId } });

    const created = await this.prisma.$transaction(
      students.map((s) => {
        count++;
        const challanNumber = `CH-${year}-${String(count).padStart(5, '0')}`;
        return this.prisma.feeChallan.create({
          data: {
            schoolId,
            studentId: s.id,
            challanNumber,
            title: dto.title,
            month: dto.month,
            academicYear: dto.academicYear,
            dueDate: new Date(dto.dueDate),
            amount: dto.amount,
            status: FeeStatus.UNPAID,
          },
        });
      }),
    );

    return { success: true, count: created.length };
  }

  async payChallan(schoolId: string, id: string, dto: PayChallanDto) {
    const challan = await this.prisma.feeChallan.findFirst({
      where: { id, schoolId },
    });

    if (!challan) throw new NotFoundException('Challan not found');

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
      include: { student: true },
    });
  }
}
