import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { MarkAttendanceDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getSectionAttendance(schoolId: string, sectionId: string, date: string) {
    const students = await this.prisma.student.findMany({
      where: { schoolId, sectionId, status: 'active' },
      include: {
        attendances: {
          where: { date },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return students.map((s) => ({
      studentId: s.id,
      admissionNumber: s.admissionNumber,
      fullName: s.fullName,
      rollNumber: s.rollNumber,
      status: s.attendances[0]?.status || 'PRESENT',
      remarks: s.attendances[0]?.remarks || '',
    }));
  }

  async markAttendance(schoolId: string, markedByUserId: string, dto: MarkAttendanceDto) {
    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, schoolId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    const results = await this.prisma.$transaction(
      dto.records.map((rec) =>
        this.prisma.attendance.upsert({
          where: {
            studentId_date: {
              studentId: rec.studentId,
              date: dto.date,
            },
          },
          create: {
            schoolId,
            sectionId: dto.sectionId,
            studentId: rec.studentId,
            date: dto.date,
            status: rec.status,
            remarks: rec.remarks,
            markedBy: markedByUserId,
          },
          update: {
            status: rec.status,
            remarks: rec.remarks,
            markedBy: markedByUserId,
          },
        }),
      ),
    );

    // Invalidate dashboard stats cache and publish real-time update
    await this.redisService.del(`dashboard:stats:${schoolId}`);
    await this.redisService.publish(`attendance:update:${schoolId}`, {
      sectionId: dto.sectionId,
      date: dto.date,
    });

    return { success: true, count: results.length };
  }

  async getStudentAttendance(schoolId: string, studentId: string, month?: string) {
    const where: any = { schoolId, studentId };
    if (month) {
      where.date = { startsWith: month }; // e.g. "2026-10"
    }

    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === 'PRESENT').length;
    const absent = records.filter((r) => r.status === 'ABSENT').length;
    const late = records.filter((r) => r.status === 'LATE').length;
    const excused = records.filter((r) => r.status === 'EXCUSED').length;

    const percentage = total > 0 ? ((present + late) / total) * 100 : 100;

    return {
      records,
      stats: {
        total,
        present,
        absent,
        late,
        excused,
        percentage: Math.round(percentage * 10) / 10,
      },
    };
  }
}
