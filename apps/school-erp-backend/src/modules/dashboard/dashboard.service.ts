import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getAdminStats(schoolId?: string, forceFresh: boolean = false) {
    let targetSchoolId = schoolId;
    if (!targetSchoolId) {
      const school = await this.prisma.school.findFirst();
      targetSchoolId = school?.id;
    }

    if (!targetSchoolId) {
      return {
        studentCount: 0,
        teacherCount: 0,
        classCount: 0,
        sectionCount: 0,
        activeStudents: 0,
        todayAttendanceRate: 100,
        attendanceRate: 100,
        totalMarkedToday: 0,
        avgExamScore: null,
        genderBreakdown: { male: 0, female: 0, other: 0 },
        attendanceByStatus: { present: 0, absent: 0, late: 0, excused: 0 },
        gradeDistribution: {},
        recentAdmissions: [],
        financials: {
          totalFees: 0,
          collectedFees: 0,
          pendingFees: 0,
          collectionRate: 100,
        },
      };
    }

    const cacheKey = `dashboard:stats:${targetSchoolId}`;
    if (!forceFresh) {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug(`📊 [DashboardService] Returning cached admin stats for school "${targetSchoolId}"`);
        return cached;
      }
    }

    this.logger.log(`📊 [DashboardService] ${forceFresh ? 'Force re-fetching (cache bypassed)' : 'Computing fresh'} admin stats for school "${targetSchoolId}"`);
    
    const today = new Date().toISOString().split('T')[0];
    const readDb = this.prisma.read || this.prisma;

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSections,
      activeStudents,
      genderGroups,
      attendanceGroups,
      marksAgg,
      gradeGroups,
      feesAgg,
      recentAdmissionsList,
    ] = await Promise.all([
      readDb.student.count({ where: { schoolId: targetSchoolId } }),
      readDb.teacher.count({ where: { schoolId: targetSchoolId } }),
      readDb.class.count({ where: { schoolId: targetSchoolId } }),
      readDb.section.count({ where: { schoolId: targetSchoolId } }),
      readDb.student.count({ where: { schoolId: targetSchoolId, status: 'active' } }),
      readDb.student.groupBy({
        by: ['gender'],
        where: { schoolId: targetSchoolId, status: 'active' },
        _count: { _all: true },
      }),
      readDb.attendance.groupBy({
        by: ['status'],
        where: { schoolId: targetSchoolId, date: today },
        _count: { _all: true },
      }),
      readDb.mark.aggregate({
        where: { schoolId: targetSchoolId },
        _sum: { obtainedMarks: true, totalMarks: true },
        _count: { _all: true },
      }),
      readDb.mark.groupBy({
        by: ['grade'],
        where: { schoolId: targetSchoolId, grade: { not: null } },
        _count: { _all: true },
      }),
      readDb.feeChallan.aggregate({
        where: { schoolId: targetSchoolId },
        _sum: { amount: true, paidAmount: true },
      }),
      readDb.student.findMany({
        where: { schoolId: targetSchoolId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { class: true, section: true, parent: true },
      }),
    ]);

    // Gender breakdown via SQL groupBy
    const genderBreakdown = { male: 0, female: 0, other: 0 };
    genderGroups.forEach((g) => {
      const key = (g.gender || 'other').toLowerCase() as 'male' | 'female' | 'other';
      if (genderBreakdown[key] !== undefined) genderBreakdown[key] += g._count._all;
      else genderBreakdown.other += g._count._all;
    });

    // Attendance breakdown via SQL groupBy
    const attendanceByStatus = { present: 0, absent: 0, late: 0, excused: 0 };
    attendanceGroups.forEach((a) => {
      const st = a.status.toLowerCase() as 'present' | 'absent' | 'late' | 'excused';
      if (attendanceByStatus[st] !== undefined) attendanceByStatus[st] += a._count._all;
    });
    const totalMarked =
      attendanceByStatus.present +
      attendanceByStatus.absent +
      attendanceByStatus.late +
      attendanceByStatus.excused;
    const presentCount = attendanceByStatus.present + attendanceByStatus.late;
    const todayAttendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : null;

    // Exam marks & grade distribution via SQL aggregate + groupBy
    let avgExamScore: number | null = null;
    const gradeDistribution: Record<string, number> = {};
    if (marksAgg._count._all > 0 && (marksAgg._sum.totalMarks ?? 0) > 0) {
      const pct = ((marksAgg._sum.obtainedMarks ?? 0) / (marksAgg._sum.totalMarks ?? 1)) * 100;
      avgExamScore = Math.round(pct * 10) / 10;
    }
    gradeGroups.forEach((g) => {
      if (g.grade) {
        gradeDistribution[g.grade] = g._count._all;
      }
    });

    // Fee financials via SQL aggregate
    const totalFees = feesAgg._sum.amount ?? 0;
    const collectedFees = feesAgg._sum.paidAmount ?? 0;
    const pendingFees = Math.max(0, totalFees - collectedFees);

    const recentAdmissions = recentAdmissionsList.map((s) => {
      const parts = (s.fullName || '').trim().split(/\s+/);
      return {
        _id: s.id,
        id: s.id,
        fullName: s.fullName,
        firstName: parts[0] || '',
        lastName: parts.slice(1).join(' ') || '',
        admissionNumber: s.admissionNumber,
        rollNumber: s.rollNumber,
        className: s.class?.name || '',
        sectionName: s.section?.name || '',
        guardianName: s.parent?.fullName || 'Guardian',
        status: s.status,
        gender: s.gender,
        createdAt: s.createdAt,
      };
    });

    const stats = {
      studentCount: totalStudents,
      teacherCount: totalTeachers,
      classCount: totalClasses,
      sectionCount: totalSections,
      activeStudents,
      totalStudents,
      totalTeachers,
      totalClasses,
      todayAttendanceRate,
      attendanceRate: todayAttendanceRate ?? 100,
      totalMarkedToday: totalMarked,
      avgExamScore,
      genderBreakdown,
      attendanceByStatus,
      gradeDistribution,
      recentAdmissions,
      financials: {
        totalFees,
        collectedFees,
        pendingFees,
        collectionRate: totalFees > 0 ? Math.round((collectedFees / totalFees) * 100) : 100,
      },
      dbLoadBalancer: this.prisma.getLoadBalancerStatus ? this.prisma.getLoadBalancerStatus() : undefined,
    };

    // Keep cache TTL low (5 seconds) so database stays fast without serving stale data
    await this.redisService.set(cacheKey, stats, 5);
    return stats;
  }

  async getTeacherDashboard(schoolId: string, teacherUserId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherUserId },
      include: {
        timetables: {
          include: { section: { include: { class: true } }, subject: true },
        },
      },
    });

    return {
      teacher,
      schedule: teacher?.timetables || [],
    };
  }

  async getStudentDashboard(schoolId: string, studentOrParentUserId: string) {
    const includeConfig = {
      class: true,
      section: true,
      school: true,
      marks: {
        include: { examTerm: true, subject: true },
        take: 10,
      },
      feeChallans: {
        orderBy: { dueDate: 'asc' as const },
        take: 5,
      },
    };

    let student = await this.prisma.student.findUnique({
      where: { userId: studentOrParentUserId },
      include: includeConfig,
    });

    if (!student) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: studentOrParentUserId },
      });
      if (parent) {
        student = await this.prisma.student.findFirst({
          where: { parentId: parent.id, schoolId },
          include: includeConfig,
        });
      }
    }

    return student;
  }

  async getSuperAdminStats() {
    const [totalSchools, totalUsers, pendingRequests] = await Promise.all([
      this.prisma.school.count(),
      this.prisma.user.count(),
      this.prisma.registrationRequest.count({ where: { status: 'PENDING' } }),
    ]);

    return {
      totalSchools,
      totalUsers,
      pendingRequests,
    };
  }
}
