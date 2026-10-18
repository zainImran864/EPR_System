import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCircularDto, QueryCircularDto } from './dto/circular.dto';
import { Role } from '@prisma/client';

@Injectable()
export class CircularsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createCircular(user: { id: string; role: Role; schoolId: string; name?: string }, dto: CreateCircularDto) {
    const circular = await this.prisma.circular.create({
      data: {
        schoolId: user.schoolId,
        title: dto.title,
        content: dto.content,
        targetType: dto.targetType || 'ALL',
        classId: (dto.targetType === 'CLASS' || dto.targetType === 'SECTION') ? dto.classId || null : null,
        sectionId: dto.targetType === 'SECTION' ? dto.sectionId || null : null,
        publishedBy: user.name || user.id,
        authorRole: user.role,
        attachmentUrl: dto.attachmentUrl || null,
        isPinned: dto.isPinned || false,
      },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });

    // Notify targeted audiences
    const targetRoles: string[] = [];
    if (dto.targetType === 'ALL') {
      targetRoles.push('ALL');
    } else if (dto.targetType === 'TEACHERS') {
      targetRoles.push('TEACHER');
    } else if (dto.targetType === 'STUDENTS') {
      targetRoles.push('STUDENT');
    } else if (dto.targetType === 'PARENTS') {
      targetRoles.push('PARENT');
    } else if (dto.targetType === 'CLASS' || dto.targetType === 'SECTION') {
      targetRoles.push('STUDENT', 'PARENT');
    }

    for (const role of targetRoles) {
      await this.notificationsService.createNotification(user.schoolId, {
        title: `📢 New Circular: ${dto.title}`,
        message: dto.content.length > 120 ? dto.content.substring(0, 117) + '...' : dto.content,
        type: 'announcement',
        targetRole: role,
        targetClassId: dto.classId,
      });
    }

    return circular;
  }

  async listCirculars(
    user: { id: string; role: Role; schoolId: string; studentContext?: { classId?: string; sectionId?: string } },
    query: QueryCircularDto,
  ) {
    const where: any = { schoolId: user.schoolId };

    if (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
      if (query.targetType) where.targetType = query.targetType;
      if (query.classId) where.classId = query.classId;
      if (query.sectionId) where.sectionId = query.sectionId;
    } else if (user.role === Role.TEACHER) {
      where.OR = [
        { targetType: 'ALL' },
        { targetType: 'TEACHERS' },
        { publishedBy: user.id },
      ];
      if (query.classId) {
        where.OR.push({ classId: query.classId });
      }
      if (query.sectionId) {
        where.OR.push({ sectionId: query.sectionId });
      }
    } else if (user.role === Role.STUDENT) {
      const student = await this.prisma.student.findFirst({
        where: { userId: user.id },
        select: { classId: true, sectionId: true },
      });

      const conditions: any[] = [
        { targetType: 'ALL' },
        { targetType: 'STUDENTS' },
      ];

      if (student?.classId) {
        conditions.push({
          targetType: 'CLASS',
          classId: student.classId,
        });
      }
      if (student?.sectionId) {
        conditions.push({
          targetType: 'SECTION',
          sectionId: student.sectionId,
        });
      }
      where.OR = conditions;
    } else if (user.role === Role.PARENT) {
      const activeClassId = user.studentContext?.classId;
      const activeSectionId = user.studentContext?.sectionId;

      const conditions: any[] = [
        { targetType: 'ALL' },
        { targetType: 'PARENTS' },
        { targetType: 'STUDENTS' },
      ];

      if (activeClassId) {
        conditions.push({
          targetType: 'CLASS',
          classId: activeClassId,
        });
      }
      if (activeSectionId) {
        conditions.push({
          targetType: 'SECTION',
          sectionId: activeSectionId,
        });
      }
      where.OR = conditions;
    }

    return this.prisma.circular.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
      take: 100,
    });
  }

  async getCircularById(id: string) {
    const circular = await this.prisma.circular.findUnique({
      where: { id },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });
    if (!circular) throw new NotFoundException('Circular not found');
    return circular;
  }

  async deleteCircular(id: string, user: { id: string; role: Role }) {
    const circular = await this.prisma.circular.findUnique({ where: { id } });
    if (!circular) throw new NotFoundException('Circular not found');

    if (
      user.role !== Role.ADMIN &&
      user.role !== Role.SUPERADMIN &&
      circular.publishedBy !== user.id
    ) {
      throw new ForbiddenException('Not authorized to delete this circular');
    }

    await this.prisma.circular.delete({ where: { id } });
    return { success: true, message: 'Circular deleted successfully' };
  }
}
