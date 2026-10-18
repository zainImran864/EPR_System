import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateHomeworkDto,
  SubmitHomeworkDto,
  GradeSubmissionDto,
  QueryHomeworkDto,
} from './dto/homework.dto';
import { Role } from '@prisma/client';

@Injectable()
export class HomeworkService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createHomework(
    user: { id: string; role: Role; schoolId: string; name?: string },
    dto: CreateHomeworkDto,
  ) {
    let teacherId = '';

    if (user.role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: user.id },
      });
      if (!teacher) throw new NotFoundException('Teacher profile not found');
      teacherId = teacher.id;
    } else {
      const anyTeacher = await this.prisma.teacher.findFirst({
        where: { schoolId: user.schoolId },
      });
      if (!anyTeacher) throw new BadRequestException('No teacher found in school to assign homework');
      teacherId = anyTeacher.id;
    }

    const homework = await this.prisma.homework.create({
      data: {
        schoolId: user.schoolId,
        classId: dto.classId,
        sectionId: dto.sectionId,
        subjectId: dto.subjectId,
        teacherId,
        title: dto.title,
        description: dto.description,
        attachmentUrl: dto.attachmentUrl || null,
        dueDate: new Date(dto.dueDate),
        maxMarks: dto.maxMarks ?? 100,
      },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, fullName: true } },
      },
    });

    // Notify students & parents of this section
    const formattedDate = new Date(dto.dueDate).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    await this.notificationsService.createNotification(user.schoolId, {
      title: `📝 New Assignment: ${dto.title}`,
      message: `Due on ${formattedDate}. Max Marks: ${dto.maxMarks ?? 100}`,
      type: 'homework',
      targetRole: 'STUDENT',
      targetClassId: dto.classId,
    });

    await this.notificationsService.createNotification(user.schoolId, {
      title: `📝 Homework Assigned: ${dto.title}`,
      message: `Due on ${formattedDate} for your child's class.`,
      type: 'homework',
      targetRole: 'PARENT',
      targetClassId: dto.classId,
    });

    return homework;
  }

  async listHomework(
    user: { id: string; role: Role; schoolId: string; studentContext?: { studentId?: string; classId?: string; sectionId?: string } },
    query: QueryHomeworkDto,
  ) {
    const where: any = { schoolId: user.schoolId };

    if (query.classId) where.classId = query.classId;
    if (query.sectionId) where.sectionId = query.sectionId;
    if (query.subjectId) where.subjectId = query.subjectId;

    let targetStudentId: string | undefined;

    if (user.role === Role.STUDENT) {
      const student = await this.prisma.student.findFirst({
        where: { userId: user.id },
      });
      if (student) {
        where.classId = student.classId;
        where.sectionId = student.sectionId;
        targetStudentId = student.id;
      }
    } else if (user.role === Role.PARENT) {
      if (user.studentContext?.classId) where.classId = user.studentContext.classId;
      if (user.studentContext?.sectionId) where.sectionId = user.studentContext.sectionId;
      targetStudentId = user.studentContext?.studentId;
    } else if (user.role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: user.id },
      });
      if (teacher && !query.classId) {
        where.teacherId = teacher.id;
      }
    }

    return this.prisma.homework.findMany({
      where,
      orderBy: { dueDate: 'desc' },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, fullName: true } },
        submissions: targetStudentId
          ? {
              where: { studentId: targetStudentId },
            }
          : {
              select: { id: true, studentId: true, status: true, isLate: true, marksObtained: true },
            },
      },
      take: 100,
    });
  }

  async getHomeworkById(
    id: string,
    user: { id: string; role: Role; schoolId: string },
  ) {
    const homework = await this.prisma.homework.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
        subject: { select: { id: true, name: true, code: true } },
        teacher: { select: { id: true, fullName: true } },
        submissions: {
          include: {
            student: { select: { id: true, fullName: true, rollNumber: true, admissionNumber: true } },
          },
        },
      },
    });

    if (!homework) throw new NotFoundException('Homework not found');
    return homework;
  }

  async submitHomework(
    homeworkId: string,
    user: { id: string; role: Role; studentContext?: { studentId?: string } },
    dto: SubmitHomeworkDto,
  ) {
    const homework = await this.prisma.homework.findUnique({
      where: { id: homeworkId },
    });
    if (!homework) throw new NotFoundException('Homework assignment not found');

    let studentId = '';
    if (user.role === Role.STUDENT) {
      const student = await this.prisma.student.findFirst({
        where: { userId: user.id },
      });
      if (!student) throw new NotFoundException('Student profile not found');
      studentId = student.id;
    } else if (user.role === Role.PARENT && user.studentContext?.studentId) {
      studentId = user.studentContext.studentId;
    } else {
      throw new ForbiddenException('Only students or parents can submit homework');
    }

    const now = new Date();
    const isLate = now > homework.dueDate;

    const status = isLate ? 'MISSED' : 'SUBMITTED';
    const marksObtained = isLate ? 0 : null;
    const feedback = isLate
      ? 'Deadline passed. Automatically marked late/missed with 0 marks.'
      : null;

    const submission = await this.prisma.homeworkSubmission.upsert({
      where: {
        homeworkId_studentId: {
          homeworkId,
          studentId,
        },
      },
      update: {
        submissionUrl: dto.submissionUrl || null,
        content: dto.content || null,
        submittedAt: now,
        isLate,
        status,
        marksObtained,
        feedback,
      },
      create: {
        homeworkId,
        studentId,
        submissionUrl: dto.submissionUrl || null,
        content: dto.content || null,
        submittedAt: now,
        isLate,
        status,
        marksObtained,
        feedback,
      },
      include: {
        homework: true,
        student: true,
      },
    });

    return submission;
  }

  async gradeSubmission(
    submissionId: string,
    user: { id: string; role: Role; name?: string },
    dto: GradeSubmissionDto,
  ) {
    const submission = await this.prisma.homeworkSubmission.findUnique({
      where: { id: submissionId },
      include: { homework: true, student: true },
    });

    if (!submission) throw new NotFoundException('Submission not found');

    if (dto.marksObtained > submission.homework.maxMarks) {
      throw new BadRequestException(
        `Marks obtained cannot exceed maximum marks (${submission.homework.maxMarks})`,
      );
    }

    const updated = await this.prisma.homeworkSubmission.update({
      where: { id: submissionId },
      data: {
        marksObtained: dto.marksObtained,
        feedback: dto.feedback || null,
        status: 'GRADED',
        gradedAt: new Date(),
        gradedBy: user.name || user.id,
      },
      include: {
        homework: true,
        student: true,
      },
    });

    // Notify student
    await this.notificationsService.createNotification(submission.homework.schoolId, {
      title: `📊 Homework Graded: ${submission.homework.title}`,
      message: `You scored ${dto.marksObtained} / ${submission.homework.maxMarks}. Feedback: ${dto.feedback || 'Good job!'}`,
      type: 'marks',
      targetRole: 'STUDENT',
      targetUserId: submission.student.userId,
    });

    return updated;
  }

  async deleteHomework(id: string, user: { id: string; role: Role }) {
    const homework = await this.prisma.homework.findUnique({ where: { id } });
    if (!homework) throw new NotFoundException('Homework not found');

    if (
      user.role !== Role.ADMIN &&
      user.role !== Role.SUPERADMIN
    ) {
      const teacher = await this.prisma.teacher.findFirst({ where: { userId: user.id } });
      if (!teacher || teacher.id !== homework.teacherId) {
        throw new ForbiddenException('Not authorized to delete this homework');
      }
    }

    await this.prisma.homework.delete({ where: { id } });
    return { success: true, message: 'Homework deleted successfully' };
  }
}
