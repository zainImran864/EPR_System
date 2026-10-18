import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { CreateClassDto, CreateSectionDto, CreateSubjectDto } from './dto/class.dto';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async listClasses(schoolId: string) {
    const readDb = this.prisma.read || this.prisma;
    const classes = await readDb.class.findMany({
      where: { schoolId },
      include: {
        sections: {
          include: {
            classTeacher: {
              select: {
                id: true,
                fullName: true,
                email: true,
                specialization: true,
              },
            },
            _count: { select: { students: true } },
          },
          orderBy: { name: 'asc' },
        },
        subjects: true,
        _count: { select: { students: true } },
      },
      orderBy: { grade: 'asc' },
    });

    return classes.map((c) => ({
      ...c,
      numericGrade: c.grade,
      academicYear: '2026-2027',
      totalStudents: c._count?.students ?? 0,
      sections: c.sections.map((s) => ({
        ...s,
        roomNumber: s.room,
        studentCount: s._count?.students ?? 0,
      })),
    }));
  }

  async createClass(schoolId: string, dto: CreateClassDto) {
    const grade = dto.grade ?? dto.numericGrade;
    if (!grade) {
      throw new BadRequestException('Either grade or numericGrade is required');
    }

    const existing = await this.prisma.class.findUnique({
      where: { schoolId_grade: { schoolId, grade } },
    });

    if (existing) {
      throw new ConflictException(`Grade ${grade} already exists in this school`);
    }

    const createdClass = await this.prisma.class.create({
      data: {
        schoolId,
        grade,
        name: dto.name,
      },
    });

    const sectionNames =
      Array.isArray(dto.sections) && dto.sections.length > 0 ? dto.sections : ['A'];

    for (const secName of sectionNames) {
      await this.prisma.section.create({
        data: {
          classId: createdClass.id,
          schoolId,
          name: secName.trim(),
          capacity: 40,
        },
      });
    }

    await this.redisService.del(`dashboard:stats:${schoolId}`);
    await this.redisService.delPattern(`school:code:*`);

    return {
      ...createdClass,
      numericGrade: createdClass.grade,
      academicYear: dto.academicYear || '2026-2027',
    };
  }

  async updateClass(schoolId: string, classId: string, dto: any) {
    const cls = await this.prisma.class.findFirst({
      where: { id: classId, schoolId },
    });
    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    const nextGrade = dto.grade ?? dto.numericGrade;

    return this.prisma.class.update({
      where: { id: classId },
      data: {
        name: dto.name ?? cls.name,
        grade: nextGrade !== undefined ? Number(nextGrade) : cls.grade,
      },
    });
  }

  async createSection(schoolId: string, dto: CreateSectionDto) {
    const classObj = await this.prisma.class.findFirst({
      where: { id: dto.classId, schoolId },
    });

    if (!classObj) {
      throw new NotFoundException('Class not found in this school');
    }

    if (dto.classTeacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { id: dto.classTeacherId, schoolId },
      });
      if (!teacher) {
        throw new NotFoundException('Selected teacher not found in this school');
      }
    }

    return this.prisma.section.create({
      data: {
        classId: dto.classId,
        schoolId,
        name: dto.name,
        room: dto.room ?? dto.roomNumber,
        capacity: dto.capacity || 40,
        classTeacherId: dto.classTeacherId || null,
      },
      include: {
        classTeacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
            specialization: true,
          },
        },
      },
    });
  }

  async updateSection(schoolId: string, sectionId: string, dto: any) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, schoolId },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (dto.classTeacherId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { id: dto.classTeacherId, schoolId },
      });
      if (!teacher) {
        throw new NotFoundException('Selected teacher not found in this school');
      }
    }

    const resolvedRoom = dto.room !== undefined ? dto.room : dto.roomNumber;

    return this.prisma.section.update({
      where: { id: sectionId },
      data: {
        name: dto.name !== undefined ? dto.name : section.name,
        room: resolvedRoom !== undefined ? resolvedRoom : section.room,
        capacity: dto.capacity !== undefined ? Number(dto.capacity) : section.capacity,
        classTeacherId: dto.classTeacherId !== undefined ? (dto.classTeacherId || null) : section.classTeacherId,
      },
      include: {
        classTeacher: {
          select: {
            id: true,
            fullName: true,
            email: true,
            specialization: true,
          },
        },
      },
    });
  }

  async deleteSection(schoolId: string, sectionId: string) {
    const section = await this.prisma.section.findFirst({
      where: { id: sectionId, schoolId },
      include: { _count: { select: { students: true } } },
    });

    if (!section) {
      throw new NotFoundException('Section not found');
    }

    if (section._count.students > 0) {
      throw new ConflictException('Cannot delete section with enrolled students');
    }

    await this.prisma.section.delete({ where: { id: sectionId } });
    return { success: true };
  }

  async listSubjects(schoolId: string) {
    return this.prisma.subject.findMany({
      where: { schoolId },
      include: { class: true },
      orderBy: { name: 'asc' },
    });
  }

  async createSubject(schoolId: string, dto: CreateSubjectDto) {
    return this.prisma.subject.create({
      data: {
        schoolId,
        name: dto.name,
        code: dto.code,
        classId: dto.classId || null,
      },
    });
  }
}
