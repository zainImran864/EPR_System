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

    const [
      totalStudents,
      totalTeachers,
      totalClasses,
      totalSections,
      activeStudents,
      studentsList,
      todayAttendance,
      allMarks,
      feeChallans,
      recentAdmissionsList,
    ] = await Promise.all([
      this.prisma.student.count({ where: { schoolId: targetSchoolId } }),
      this.prisma.teacher.count({ where: { schoolId: targetSchoolId } }),
      this.prisma.class.count({ where: { schoolId: targetSchoolId } }),
      this.prisma.section.count({ where: { schoolId: targetSchoolId } }),
      this.prisma.student.count({ where: { schoolId: targetSchoolId, status: 'active' } }),
      this.prisma.student.findMany({
        where: { schoolId: targetSchoolId, status: 'active' },
        select: { gender: true },
      }),
      this.prisma.attendance.findMany({
        where: { schoolId: targetSchoolId, date: today },
        select: { status: true },
      }),
      this.prisma.mark.findMany({
        where: { schoolId: targetSchoolId },
        select: { obtainedMarks: true, totalMarks: true, grade: true },
      }),
      this.prisma.feeChallan.findMany({
        where: { schoolId: targetSchoolId },
        select: { amount: true, paidAmount: true, status: true },
      }),
      this.prisma.student.findMany({
        where: { schoolId: targetSchoolId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { class: true, section: true },
      }),
    ]);

    // Gender breakdown
    const genderBreakdown = { male: 0, female: 0, other: 0 };
    studentsList.forEach((s) => {
      const g = (s.gender || 'other').toLowerCase() as 'male' | 'female' | 'other';
      if (genderBreakdown[g] !== undefined) genderBreakdown[g]++;
      else genderBreakdown.other++;
    });

    // Attendance breakdown
    const attendanceByStatus = { present: 0, absent: 0, late: 0, excused: 0 };
    todayAttendance.forEach((a) => {
      const st = a.status.toLowerCase() as 'present' | 'absent' | 'late' | 'excused';
      if (attendanceByStatus[st] !== undefined) attendanceByStatus[st]++;
    });
    const totalMarked = todayAttendance.length;
    const presentCount = attendanceByStatus.present + attendanceByStatus.late;
    const todayAttendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : null;

    // Exam marks & grade distribution
    let avgExamScore: number | null = null;
    const gradeDistribution: Record<string, number> = {};
    if (allMarks.length > 0) {
      const totalPct = allMarks.reduce(
        (sum, m) => sum + (m.totalMarks > 0 ? (m.obtainedMarks / m.totalMarks) * 100 : 0),
        0,
      );
      avgExamScore = Math.round((totalPct / allMarks.length) * 10) / 10;
      allMarks.forEach((m) => {
        if (m.grade) {
          gradeDistribution[m.grade] = (gradeDistribution[m.grade] ?? 0) + 1;
        }
      });
    }

    // Fee financials
    const totalFees = feeChallans.reduce((sum, f) => sum + f.amount, 0);
    const collectedFees = feeChallans.reduce((sum, f) => sum + f.paidAmount, 0);
    const pendingFees = Math.max(0, totalFees - collectedFees);

    const recentAdmissions = recentAdmissionsList.map((s) => ({
      _id: s.id,
      id: s.id,
      fullName: s.fullName,
      admissionNumber: s.admissionNumber,
      rollNumber: s.rollNumber,
      className: s.class?.name || '',
      sectionName: s.section?.name || '',
      status: s.status,
      gender: s.gender,
      createdAt: s.createdAt,
    }));

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
    };

    // Cache for 30 seconds for optimal live updates
    await this.redisService.set(cacheKey, stats, 30);
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

  async getStudentDashboard(schoolId: string, studentUserId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId: studentUserId },
      include: {
        class: true,
        section: true,
        school: true,
        marks: {
          include: { examTerm: true, subject: true },
          take: 10,
        },
        feeChallans: {
          orderBy: { dueDate: 'asc' },
          take: 5,
        },
      },
    });

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
