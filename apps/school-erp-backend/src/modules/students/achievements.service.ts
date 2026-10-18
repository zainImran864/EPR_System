import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface BadgeDefinition {
  badgeType: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: boolean;
  progress: number; // 0 to 100
  awardedAt?: string;
}

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentAchievements(studentId: string, schoolId: string): Promise<BadgeDefinition[]> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    // Fetch stored achievements
    const stored = await this.prisma.studentAchievement.findMany({
      where: { studentId },
    });
    const storedMap = new Map(stored.map((a) => [a.badgeType, a]));

    // 1. Weekly Attendance Calculation
    const recentAttendance = await this.prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
      take: 5,
    });
    const recentTotal = recentAttendance.length;
    const recentAbsent = recentAttendance.filter((a) => a.status === 'ABSENT').length;
    const isPerfectWeek = recentTotal >= 4 && recentAbsent === 0;
    const attendanceProgress = recentTotal > 0
      ? Math.min(100, Math.round(((recentTotal - recentAbsent) / Math.max(recentTotal, 5)) * 100))
      : 0;

    // Auto-save star if achieved and not already stored
    if (isPerfectWeek && !storedMap.has('PERFECT_ATTENDANCE')) {
      const created = await this.prisma.studentAchievement.create({
        data: {
          schoolId,
          studentId,
          badgeType: 'PERFECT_ATTENDANCE',
          title: '⭐ Weekly Attendance Star',
          description: 'Attended all classes for a full school week without any absences!',
          icon: 'star',
        },
      });
      storedMap.set('PERFECT_ATTENDANCE', created);
    }

    // 2. Academic Star Calculation (Exam Marks)
    const marks = await this.prisma.mark.findMany({
      where: { studentId },
    });
    let avgScore = 0;
    if (marks.length > 0) {
      const totalObtained = marks.reduce((sum, m) => sum + m.obtainedMarks, 0);
      const totalMax = marks.reduce((sum, m) => sum + (m.totalMarks || 100), 0);
      avgScore = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    }
    const isAcademicStar = avgScore >= 80;

    if (isAcademicStar && !storedMap.has('ACADEMIC_STAR')) {
      const created = await this.prisma.studentAchievement.create({
        data: {
          schoolId,
          studentId,
          badgeType: 'ACADEMIC_STAR',
          title: '🏆 Academic Excellence Star',
          description: 'Maintained outstanding scores with an 80%+ cumulative exam average!',
          icon: 'award',
        },
      });
      storedMap.set('ACADEMIC_STAR', created);
    }

    // 3. Homework Champion Calculation
    const submissions = await this.prisma.homeworkSubmission.findMany({
      where: { studentId },
    });
    const totalSubmissions = submissions.length;
    const onTimeSubmissions = submissions.filter((s) => !s.isLate && s.status !== 'MISSED').length;
    const isHomeworkChamp = totalSubmissions >= 3 && onTimeSubmissions === totalSubmissions;
    const hwProgress = totalSubmissions > 0 ? Math.round((onTimeSubmissions / totalSubmissions) * 100) : 0;

    if (isHomeworkChamp && !storedMap.has('HOMEWORK_CHAMP')) {
      const created = await this.prisma.studentAchievement.create({
        data: {
          schoolId,
          studentId,
          badgeType: 'HOMEWORK_CHAMP',
          title: '🌟 Homework Champion',
          description: 'Submitted all assigned homework solutions on time with zero late penalties!',
          icon: 'book',
        },
      });
      storedMap.set('HOMEWORK_CHAMP', created);
    }

    // 4. Punctuality Master
    const lateRecords = recentAttendance.filter((a) => a.status === 'LATE').length;
    const isPunctual = recentTotal >= 4 && lateRecords === 0;

    if (isPunctual && !storedMap.has('PUNCTUALITY')) {
      const created = await this.prisma.studentAchievement.create({
        data: {
          schoolId,
          studentId,
          badgeType: 'PUNCTUALITY',
          title: '⏱️ Punctuality Master',
          description: 'Never late to school or class sessions — 100% on-time arrivals.',
          icon: 'clock',
        },
      });
      storedMap.set('PUNCTUALITY', created);
    }

    // Compile definitions
    const badges: BadgeDefinition[] = [
      {
        badgeType: 'PERFECT_ATTENDANCE',
        title: '⭐ Weekly Attendance Star',
        description: 'Attended all classes for a full school week without any absences!',
        icon: 'star',
        isUnlocked: storedMap.has('PERFECT_ATTENDANCE') || isPerfectWeek,
        progress: attendanceProgress,
        awardedAt: storedMap.get('PERFECT_ATTENDANCE')?.awardedAt?.toISOString(),
      },
      {
        badgeType: 'ACADEMIC_STAR',
        title: '🏆 Academic Excellence Star',
        description: 'Maintained outstanding scores with an 80%+ cumulative exam average!',
        icon: 'award',
        isUnlocked: storedMap.has('ACADEMIC_STAR') || isAcademicStar,
        progress: Math.min(100, Math.round(avgScore)),
        awardedAt: storedMap.get('ACADEMIC_STAR')?.awardedAt?.toISOString(),
      },
      {
        badgeType: 'HOMEWORK_CHAMP',
        title: '🌟 Homework Champion',
        description: 'Submitted all assigned homework solutions on time with zero late penalties!',
        icon: 'book',
        isUnlocked: storedMap.has('HOMEWORK_CHAMP') || isHomeworkChamp,
        progress: hwProgress,
        awardedAt: storedMap.get('HOMEWORK_CHAMP')?.awardedAt?.toISOString(),
      },
      {
        badgeType: 'PUNCTUALITY',
        title: '⏱️ Punctuality Master',
        description: 'Never late to school or class sessions — 100% on-time arrivals.',
        icon: 'clock',
        isUnlocked: storedMap.has('PUNCTUALITY') || isPunctual,
        progress: lateRecords === 0 && recentTotal > 0 ? 100 : Math.max(0, 100 - lateRecords * 25),
        awardedAt: storedMap.get('PUNCTUALITY')?.awardedAt?.toISOString(),
      },
    ];

    return badges;
  }

  async manualAward(
    studentId: string,
    schoolId: string,
    dto: { badgeType: string; title: string; description: string; icon?: string },
  ) {
    return this.prisma.studentAchievement.create({
      data: {
        schoolId,
        studentId,
        badgeType: dto.badgeType,
        title: dto.title,
        description: dto.description,
        icon: dto.icon || 'star',
      },
    });
  }
}
