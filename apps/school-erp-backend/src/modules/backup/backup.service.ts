import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { NotificationDocument } from '../../database/schemas/notification.schema';
import * as fs from 'fs';
import * as path from 'path';

export interface BackupResult {
  success: boolean;
  filename: string;
  timestamp: string;
  schoolCode: string;
  recordCounts: Record<string, number>;
  totalRecords: number;
  data: any;
}

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor(
    private readonly prisma: PrismaService,
    @InjectModel('Notification')
    private readonly notificationModel: Model<NotificationDocument>,
  ) {
    if (!fs.existsSync(this.backupDir)) {
      try {
        fs.mkdirSync(this.backupDir, { recursive: true });
      } catch (err) {
        this.logger.warn(`Could not create backup directory: ${err}`);
      }
    }

    // Initialize automated backup checker (runs every 60 seconds)
    setInterval(() => {
      this.checkAndRunScheduledBackups().catch((err) => {
        this.logger.error(`Automated backup error: ${err}`);
      });
    }, 60000);
  }

  async generateBackup(schoolId: string): Promise<BackupResult> {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    this.logger.log(`Initiating full backup snapshot for school: ${school.name} (${school.code})...`);

    // Fetch all primary relational datasets in parallel
    const [
      classes,
      sections,
      subjects,
      users,
      teachers,
      students,
      parents,
      attendances,
      teacherAttendances,
      teacherLeaves,
      examTerms,
      marks,
      feeChallans,
      expenses,
      timetables,
      questionPapers,
      studentLeaves,
      circulars,
      homeworks,
      submissions,
      parentMeetings,
      achievements,
    ] = await Promise.all([
      this.prisma.read.class.findMany({ where: { schoolId } }),
      this.prisma.read.section.findMany({ where: { schoolId } }),
      this.prisma.read.subject.findMany({ where: { schoolId } }),
      this.prisma.read.user.findMany({
        where: { schoolId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
          themeColor: true,
          createdAt: true,
        },
      }),
      this.prisma.read.teacher.findMany({ where: { schoolId } }),
      this.prisma.read.student.findMany({ where: { schoolId } }),
      this.prisma.read.parent.findMany(),
      this.prisma.read.attendance.findMany({ where: { schoolId } }),
      this.prisma.read.teacherAttendance.findMany({ where: { schoolId } }),
      this.prisma.read.teacherLeave.findMany({ where: { schoolId } }),
      this.prisma.read.examTerm.findMany({ where: { schoolId } }),
      this.prisma.read.mark.findMany({ where: { schoolId } }),
      this.prisma.read.feeChallan.findMany({ where: { schoolId } }),
      this.prisma.read.expense.findMany({ where: { schoolId } }),
      this.prisma.read.timetableEntry.findMany({ where: { schoolId } }),
      this.prisma.read.examQuestionPaper.findMany({ where: { schoolId } }),
      this.prisma.read.studentLeaveRequest.findMany({ where: { schoolId } }),
      this.prisma.read.circular.findMany({ where: { schoolId } }),
      this.prisma.read.homework.findMany({ where: { schoolId } }),
      this.prisma.read.homeworkSubmission.findMany({ where: { homework: { schoolId } } }),
      this.prisma.read.parentMeeting.findMany({ where: { schoolId } }),
      this.prisma.read.studentAchievement.findMany({ where: { schoolId } }),
    ]);

    // Fetch MongoDB notifications
    let notifications: any[] = [];
    try {
      if (this.notificationModel) {
        notifications = await this.notificationModel.find({ schoolId }).lean().exec();
      }
    } catch (err) {
      this.logger.warn(`Could not export mongo notifications: ${err}`);
    }

    const timestamp = new Date().toISOString();
    const cleanDate = timestamp.replace(/[:.]/g, '-');
    const filename = `backup_${school.code}_${cleanDate}.json`;

    const recordCounts = {
      classes: classes.length,
      sections: sections.length,
      subjects: subjects.length,
      users: users.length,
      teachers: teachers.length,
      students: students.length,
      parents: parents.length,
      attendances: attendances.length,
      teacherAttendances: teacherAttendances.length,
      teacherLeaves: teacherLeaves.length,
      examTerms: examTerms.length,
      marks: marks.length,
      feeChallans: feeChallans.length,
      expenses: expenses.length,
      timetables: timetables.length,
      questionPapers: questionPapers.length,
      studentLeaves: studentLeaves.length,
      circulars: circulars.length,
      homeworks: homeworks.length,
      homeworkSubmissions: submissions.length,
      parentMeetings: parentMeetings.length,
      achievements: achievements.length,
      notifications: notifications.length,
    };

    const totalRecords = Object.values(recordCounts).reduce((a, b) => a + b, 0);

    const snapshot = {
      meta: {
        version: '2.0.0',
        platform: 'AcademiX School ERP',
        exportedAt: timestamp,
        school: {
          id: school.id,
          name: school.name,
          code: school.code,
          activeYear: school.activeYear,
          currencySymbol: school.currencySymbol || '$',
          currencyCode: school.currencyCode || 'USD',
          schoolStartTime: school.schoolStartTime || '07:30',
          schoolEndTime: school.schoolEndTime || '14:00',
        },
        recordCounts,
        totalRecords,
      },
      data: {
        school,
        classes,
        sections,
        subjects,
        users,
        teachers,
        students,
        parents,
        attendances,
        teacherAttendances,
        teacherLeaves,
        examTerms,
        marks,
        feeChallans,
        expenses,
        timetables,
        questionPapers,
        studentLeaves,
        circulars,
        homeworks,
        homeworkSubmissions: submissions,
        parentMeetings,
        achievements,
        notifications,
      },
    };

    // Save to disk for durability
    try {
      const filePath = path.join(this.backupDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2), 'utf-8');
      this.logger.log(`Backup saved to disk at: ${filePath} (${totalRecords} records)`);
    } catch (err) {
      this.logger.warn(`Could not write backup to disk: ${err}`);
    }

    // Update last backup timestamp on school record
    await this.prisma.school.update({
      where: { id: schoolId },
      data: { lastBackupAt: new Date() },
    });

    return {
      success: true,
      filename,
      timestamp,
      schoolCode: school.code,
      recordCounts,
      totalRecords,
      data: snapshot,
    };
  }

  async getBackupStatus(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        id: true,
        name: true,
        code: true,
        autoBackupEnabled: true,
        backupScheduleTime: true,
        backupFrequency: true,
        lastBackupAt: true,
      },
    });

    if (!school) throw new NotFoundException('School not found');

    // List recent disk backup files for this school
    let availableFiles: { filename: string; sizeBytes: number; createdAt: string }[] = [];
    try {
      if (fs.existsSync(this.backupDir)) {
        const files = fs.readdirSync(this.backupDir);
        availableFiles = files
          .filter((f) => f.startsWith(`backup_${school.code}_`) && f.endsWith('.json'))
          .map((f) => {
            const stats = fs.statSync(path.join(this.backupDir, f));
            return {
              filename: f,
              sizeBytes: stats.size,
              createdAt: stats.mtime.toISOString(),
            };
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 10);
      }
    } catch {}

    return {
      ...school,
      availableFiles,
    };
  }

  async updateConfig(
    schoolId: string,
    dto: { autoBackupEnabled?: boolean; backupScheduleTime?: string; backupFrequency?: string },
  ) {
    const updated = await this.prisma.school.update({
      where: { id: schoolId },
      data: {
        autoBackupEnabled: dto.autoBackupEnabled,
        backupScheduleTime: dto.backupScheduleTime,
        backupFrequency: dto.backupFrequency,
      },
      select: {
        id: true,
        name: true,
        code: true,
        autoBackupEnabled: true,
        backupScheduleTime: true,
        backupFrequency: true,
        lastBackupAt: true,
      },
    });

    return updated;
  }

  private async checkAndRunScheduledBackups() {
    const now = new Date();
    const currentHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const eligibleSchools = await this.prisma.school.findMany({
      where: {
        autoBackupEnabled: true,
        backupScheduleTime: currentHHmm,
      },
    });

    for (const school of eligibleSchools) {
      // Prevent running multiple times in the same minute
      if (school.lastBackupAt) {
        const diffMs = now.getTime() - new Date(school.lastBackupAt).getTime();
        if (diffMs < 300000) {
          continue; // backed up in last 5 minutes
        }
      }

      this.logger.log(`⏰ Executing scheduled automated backup for school: ${school.name} at ${currentHHmm}...`);
      await this.generateBackup(school.id).catch((err) => {
        this.logger.error(`Scheduled backup failed for school ${school.id}: ${err}`);
      });
    }
  }
}
