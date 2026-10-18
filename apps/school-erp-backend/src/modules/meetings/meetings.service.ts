import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateMeetingDto, UpdateMeetingStatusDto, QueryMeetingDto } from './dto/meeting.dto';
import { Role, RequestStatus } from '@prisma/client';

@Injectable()
export class MeetingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createMeeting(
    user: { id: string; role: Role; schoolId: string; name?: string; studentContext?: { studentId?: string } },
    dto: CreateMeetingDto,
  ) {
    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
      include: {
        parent: true,
        class: true,
        section: true,
      },
    });
    if (!student) throw new NotFoundException('Student record not found');

    let teacherId = dto.teacherId;

    if (user.role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: user.id },
      });
      if (!teacher) throw new NotFoundException('Teacher profile not found');
      teacherId = teacher.id;
    } else if (!teacherId) {
      const section = student.sectionId
        ? await this.prisma.section.findUnique({ where: { id: student.sectionId } })
        : null;
      if (section?.classTeacherId) {
        teacherId = section.classTeacherId;
      } else {
        const anyTeacher = await this.prisma.teacher.findFirst({
          where: { schoolId: user.schoolId },
        });
        if (!anyTeacher) throw new BadRequestException('No teacher available for meeting');
        teacherId = anyTeacher.id;
      }
    }

    let parentId = student.parentId;
    if (!parentId) {
      const parentUser = await this.prisma.parent.findFirst({
        where: { children: { some: { schoolId: user.schoolId } } },
      });
      if (!parentUser) throw new BadRequestException('No parent record found for student');
      parentId = parentUser.id;
    }

    const meeting = await this.prisma.parentMeeting.create({
      data: {
        schoolId: user.schoolId,
        teacherId,
        studentId: student.id,
        parentId,
        meetingDate: dto.meetingDate,
        timeSlot: dto.timeSlot,
        agenda: dto.agenda,
        mode: dto.mode || 'IN_PERSON',
        status: RequestStatus.PENDING,
        teacherNotes: user.role === Role.TEACHER ? dto.notes || null : null,
        parentNotes: user.role === Role.PARENT ? dto.notes || null : null,
      },
      include: {
        teacher: { select: { id: true, fullName: true, email: true, phone: true } },
        student: { select: { id: true, fullName: true, rollNumber: true, admissionNumber: true } },
        parent: { select: { id: true, fullName: true, email: true, phone: true } },
      },
    });

    const formattedTime = `${dto.meetingDate} at ${dto.timeSlot}`;

    // Notify counterparty
    if (user.role === Role.TEACHER || user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
      await this.notificationsService.createNotification(user.schoolId, {
        title: `🤝 Parent-Teacher Meeting Requested`,
        message: `Teacher ${meeting.teacher.fullName} scheduled a meeting regarding ${student.fullName} on ${formattedTime}. Agenda: ${dto.agenda}`,
        type: 'meeting',
        targetRole: 'PARENT',
      });
    } else {
      const teacherUser = await this.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: { userId: true },
      });
      if (teacherUser) {
        await this.notificationsService.createNotification(user.schoolId, {
          title: `🤝 PTM Request from Parent`,
          message: `Parent requested a meeting regarding ${student.fullName} on ${formattedTime}. Agenda: ${dto.agenda}`,
          type: 'meeting',
          targetRole: 'TEACHER',
          targetUserId: teacherUser.userId,
        });
      }
    }

    return meeting;
  }

  async listMeetings(
    user: { id: string; role: Role; schoolId: string; studentContext?: { studentId?: string } },
    query: QueryMeetingDto,
  ) {
    const where: any = { schoolId: user.schoolId };

    if (query.status) where.status = query.status as RequestStatus;
    if (query.studentId) where.studentId = query.studentId;

    if (user.role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: user.id },
      });
      if (teacher) where.teacherId = teacher.id;
    } else if (user.role === Role.PARENT) {
      if (user.studentContext?.studentId) {
        where.studentId = user.studentContext.studentId;
      } else {
        const parentRecord = await this.prisma.parent.findFirst({ where: { userId: user.id } });
        if (parentRecord) where.parentId = parentRecord.id;
      }
    } else if (user.role === Role.STUDENT) {
      const student = await this.prisma.student.findFirst({
        where: { userId: user.id },
      });
      if (student) where.studentId = student.id;
    }

    return this.prisma.parentMeeting.findMany({
      where,
      orderBy: { meetingDate: 'desc' },
      include: {
        teacher: { select: { id: true, fullName: true, email: true, phone: true } },
        parent: { select: { id: true, fullName: true, email: true, phone: true } },
        student: {
          select: {
            id: true,
            fullName: true,
            rollNumber: true,
            admissionNumber: true,
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
          },
        },
      },
      take: 100,
    });
  }

  async updateMeetingStatus(
    id: string,
    user: { id: string; role: Role; name?: string },
    dto: UpdateMeetingStatusDto,
  ) {
    const meeting = await this.prisma.parentMeeting.findUnique({
      where: { id },
      include: { teacher: true, student: true },
    });
    if (!meeting) throw new NotFoundException('Meeting not found');

    const updateData: any = { status: dto.status };
    if (user.role === Role.TEACHER || user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
      if (dto.notes) updateData.teacherNotes = dto.notes;
    } else {
      if (dto.notes) updateData.parentNotes = dto.notes;
    }

    const updated = await this.prisma.parentMeeting.update({
      where: { id },
      data: updateData,
      include: {
        teacher: { select: { id: true, fullName: true } },
        student: { select: { id: true, fullName: true } },
      },
    });

    await this.notificationsService.createNotification(meeting.schoolId, {
      title: `🤝 PTM Status: ${dto.status}`,
      message: `Meeting regarding ${meeting.student.fullName} has been updated to ${dto.status}.`,
      type: 'meeting',
      targetRole: 'PARENT',
    });

    return updated;
  }
}
