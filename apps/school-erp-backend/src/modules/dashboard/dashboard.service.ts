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

  async getAdminStats(schoolId: string, forceFresh: boolean = false) {
    const cacheKey = `dashboard:stats:${schoolId}`;
    if (!forceFresh) {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug(`📊 [DashboardService] Returning cached admin stats for school "${schoolId}"`);
        return cached;
      }
    }

    this.logger.log(`📊 [DashboardService] ${forceFresh ? 'Force re-fetching (cache bypassed)' : 'Computing fresh'} admin stats for school "${schoolId}"`);
    const [totalStudents, totalTeachers, totalClasses, activeStudents] = await Promise.all([
      this.prisma.student.count({ where: { schoolId } }),
      this.prisma.teacher.count({ where: { schoolId } }),
      this.prisma.class.count({ where: { schoolId } }),
      this.prisma.student.count({ where: { schoolId, status: 'active' } }),
    ]);

    // Today's attendance percentage
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = await this.prisma.attendance.findMany({
      where: { schoolId, date: today },
    });

    const totalMarked = todayAttendance.length;
    const presentCount = todayAttendance.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 100;

    // Fee collection stats
    const feeChallans = await this.prisma.feeChallan.findMany({
      where: { schoolId },
      select: { amount: true, paidAmount: true, status: true },
    });

    const totalFees = feeChallans.reduce((sum, f) => sum + f.amount, 0);
    const collectedFees = feeChallans.reduce((sum, f) => sum + f.paidAmount, 0);
    const pendingFees = Math.max(0, totalFees - collectedFees);

    const stats = {
      totalStudents,
      totalTeachers,
      totalClasses,
      activeStudents,
      attendanceRate,
      totalMarkedToday: totalMarked,
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
