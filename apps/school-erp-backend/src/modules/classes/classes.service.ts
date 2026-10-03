import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
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
    return this.prisma.class.findMany({
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
  }

  async createClass(schoolId: string, dto: CreateClassDto) {
    const existing = await this.prisma.class.findUnique({
      where: { schoolId_grade: { schoolId, grade: dto.grade } },
    });

    if (existing) {
      throw new ConflictException(`Grade ${dto.grade} already exists in this school`);
    }

    const createdClass = await this.prisma.class.create({
      data: {
        schoolId,
        grade: dto.grade,
        name: dto.name,
      },
    });

    // Create default section 'A'
    await this.prisma.section.create({
      data: {
        classId: createdClass.id,
        schoolId,
        name: 'A',
        capacity: 40,
      },
    });

    await this.redisService.del(`dashboard:stats:${schoolId}`);
    await this.redisService.delPattern(`school:code:*`);

    return createdClass;
  }

  async updateClass(schoolId: string, classId: string, dto: any) {
    const cls = await this.prisma.class.findFirst({
      where: { id: classId, schoolId },
    });
    if (!cls) {
      throw new NotFoundException('Class not found');
    }

    return this.prisma.class.update({
      where: { id: classId },
      data: {
        name: dto.name ?? cls.name,
        grade: dto.grade !== undefined ? Number(dto.grade) : cls.grade,
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
        room: dto.room,
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

    return this.prisma.section.update({
      where: { id: sectionId },
      data: {
        name: dto.name !== undefined ? dto.name : section.name,
        room: dto.room !== undefined ? dto.room : section.room,
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
