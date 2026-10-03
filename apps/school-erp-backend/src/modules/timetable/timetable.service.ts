import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTimetableEntryDto } from './dto/timetable.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class TimetableService {
  constructor(private readonly prisma: PrismaService) {}

  async getSectionTimetable(schoolId: string, sectionId: string) {
    return this.prisma.timetableEntry.findMany({
      where: { schoolId, sectionId },
      include: {
        subject: true,
        teacher: true,
        section: { include: { class: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });
  }

  async getTeacherTimetable(schoolId: string, teacherId: string) {
    return this.prisma.timetableEntry.findMany({
      where: { schoolId, teacherId },
      include: {
        subject: true,
        teacher: true,
        section: { include: { class: true } },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { periodNumber: 'asc' }],
    });
  }

  async getStudentTimetable(schoolId: string, studentId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { section: { include: { class: true } } },
    });

    if (!student) {
      throw new NotFoundException('Student record not found');
    }

    const slots = await this.getSectionTimetable(schoolId, student.sectionId);
    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        className: student.section.class.name,
        sectionName: student.section.name,
      },
      slots,
    };
  }

  async getMyTimetable(user: CurrentUserPayload) {
    const schoolId = user.schoolId;
    if (!schoolId) {
      throw new NotFoundException('No active school linked to user session');
    }

    if (user.role === Role.TEACHER) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: user.userId },
      });
      if (!teacher) throw new NotFoundException('Teacher profile not found');
      const slots = await this.getTeacherTimetable(schoolId, teacher.id);
      return {
        type: 'TEACHER',
        profile: teacher,
        slots,
      };
    }

    if (user.role === Role.STUDENT) {
      const student = await this.prisma.student.findUnique({
        where: { userId: user.userId },
        include: { section: { include: { class: true } } },
      });
      if (!student) throw new NotFoundException('Student profile not found');
      const slots = await this.getSectionTimetable(schoolId, student.sectionId);
      return {
        type: 'STUDENT',
        profile: student,
        slots,
      };
    }

    if (user.role === Role.PARENT) {
      const parent = await this.prisma.parent.findUnique({
        where: { userId: user.userId },
        include: {
          children: {
            include: { section: { include: { class: true } } },
          },
        },
      });
      if (!parent) throw new NotFoundException('Parent profile not found');

      const childrenTimetables = await Promise.all(
        parent.children.map(async (child) => {
          const slots = await this.getSectionTimetable(schoolId, child.sectionId);
          return {
            child: {
              id: child.id,
              fullName: child.fullName,
              className: child.section.class.name,
              sectionName: child.section.name,
            },
            slots,
          };
        }),
      );

      return {
        type: 'PARENT',
        profile: parent,
        children: childrenTimetables,
      };
    }

    // Default for Admin / SuperAdmin
    return {
      type: user.role,
      message: 'Select a class section or teacher to inspect their timetable matrix.',
    };
  }

  async createEntry(schoolId: string, dto: CreateTimetableEntryDto) {
    // 0. Verify section exists
    const section = await this.prisma.section.findFirst({
      where: { id: dto.sectionId, schoolId },
      include: { class: true },
    });
    if (!section) {
      throw new NotFoundException('Section not found in this school');
    }

    // 1. Resolve Subject (by ID or by Name, auto-creating if needed)
    let subject = null;
    if (dto.subjectId) {
      subject = await this.prisma.subject.findFirst({
        where: { id: dto.subjectId, schoolId },
      });
    }

    if (!subject) {
      const subjectName = (dto.subjectName || dto.subjectId || 'General Studies').trim();
      subject = await this.prisma.subject.findFirst({
        where: {
          schoolId,
          name: { equals: subjectName, mode: 'insensitive' },
        },
      });

      if (!subject) {
        subject = await this.prisma.subject.create({
          data: {
            schoolId,
            classId: section.classId,
            name: subjectName,
          },
        });
      }
    }

    // 2. Resolve Teacher (by ID or fallback to section classTeacher or school faculty)
    let teacher = null;
    if (dto.teacherId) {
      teacher = await this.prisma.teacher.findFirst({
        where: { id: dto.teacherId, schoolId },
      });
    }

    if (!teacher && section.classTeacherId) {
      teacher = await this.prisma.teacher.findFirst({
        where: { id: section.classTeacherId, schoolId },
      });
    }

    if (!teacher) {
      teacher = await this.prisma.teacher.findFirst({
        where: { schoolId },
      });
    }

    if (!teacher) {
      throw new NotFoundException(
        'No active faculty found for this institution. Please register at least one teacher before building timetables.',
      );
    }

    const resolvedSubjectId = subject.id;
    const resolvedTeacherId = teacher.id;

    // 3. Check teacher collision unless combined class is explicitly enabled
    if (!dto.allowCombinedClass) {
      const teacherClash = await this.prisma.timetableEntry.findFirst({
        where: {
          schoolId,
          teacherId: resolvedTeacherId,
          dayOfWeek: dto.dayOfWeek,
          periodNumber: dto.periodNumber,
          NOT: {
            sectionId: dto.sectionId,
          },
        },
        include: { teacher: true, section: { include: { class: true } } },
      });

      if (teacherClash) {
        throw new ConflictException(
          `Teacher ${teacherClash.teacher.fullName} is already scheduled in ${teacherClash.section.class.name} (Section ${teacherClash.section.name}) at Period ${dto.periodNumber} (${dto.dayOfWeek}). Enable "Combined Class" if this is a joint session.`,
        );
      }
    }

    // 4. Check if another section is in the same room (informational / allowed)
    let sharedRoomInfo: string | null = null;
    if (dto.room) {
      const existingRoomEntry = await this.prisma.timetableEntry.findFirst({
        where: {
          schoolId,
          room: dto.room,
          dayOfWeek: dto.dayOfWeek,
          periodNumber: dto.periodNumber,
          NOT: {
            sectionId: dto.sectionId,
          },
        },
        include: { section: { include: { class: true } } },
      });

      if (existingRoomEntry) {
        sharedRoomInfo = `Room ${dto.room} is shared with ${existingRoomEntry.section.class.name} (${existingRoomEntry.section.name}).`;
      }
    }

    // 5. Upsert entry for the section
    const savedEntry = await this.prisma.timetableEntry.upsert({
      where: {
        sectionId_dayOfWeek_periodNumber: {
          sectionId: dto.sectionId,
          dayOfWeek: dto.dayOfWeek,
          periodNumber: dto.periodNumber,
        },
      },
      create: {
        schoolId,
        sectionId: dto.sectionId,
        subjectId: resolvedSubjectId,
        teacherId: resolvedTeacherId,
        dayOfWeek: dto.dayOfWeek,
        periodNumber: dto.periodNumber,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
      },
      update: {
        subjectId: resolvedSubjectId,
        teacherId: resolvedTeacherId,
        startTime: dto.startTime,
        endTime: dto.endTime,
        room: dto.room,
      },
      include: {
        subject: true,
        teacher: true,
        section: { include: { class: true } },
      },
    });

    return {
      ...savedEntry,
      sharedRoomInfo,
    };
  }

  async deleteEntry(schoolId: string, id: string) {
    const entry = await this.prisma.timetableEntry.findFirst({
      where: { id, schoolId },
    });
    if (!entry) throw new NotFoundException('Timetable entry not found');

    await this.prisma.timetableEntry.delete({ where: { id } });
    return { success: true };
  }
}
