import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateTeacherDto, UpdateTeacherDto } from './dto/teacher.dto';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class TeachersService {
  constructor(private readonly prisma: PrismaService) {}

  async listTeachers(schoolId: string, search?: string) {
    const where: any = { schoolId };
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { employeeId: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.teacher.findMany({
      where,
      include: {
        user: { select: { status: true, avatarUrl: true, phone: true } },
        timetables: {
          include: { section: { include: { class: true } }, subject: true },
        },
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async getTeacherById(schoolId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id, schoolId },
      include: {
        user: true,
        timetables: {
          include: { section: { include: { class: true } }, subject: true },
        },
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    return teacher;
  }

  async createTeacher(schoolId: string, dto: CreateTeacherDto) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    const normalizedEmail = dto.email.toLowerCase().trim();
    const existingUser = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Generate sequential Employee ID e.g. EMP-001
    const count = await this.prisma.teacher.count({ where: { schoolId } });
    const employeeId = `EMP-${String(count + 1).padStart(3, '0')}`;

    const defaultPass = dto.password || 'Teacher@123';
    const passwordHash = await bcrypt.hash(defaultPass, 10);

    // Create User record and Teacher profile inside a transaction
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          schoolId,
          name: dto.fullName,
          email: normalizedEmail,
          passwordHash,
          role: Role.TEACHER,
          status: UserStatus.ACTIVE,
          phone: dto.phone,
          mustChangePassword: true,
        },
      });

      const teacher = await tx.teacher.create({
        data: {
          schoolId,
          userId: user.id,
          employeeId,
          fullName: dto.fullName,
          email: normalizedEmail,
          phone: dto.phone,
          qualification: dto.qualification,
          designation: dto.designation || 'Teacher',
          specialization: dto.specialization,
        },
        include: { user: true },
      });

      return teacher;
    });
  }

  async updateTeacher(schoolId: string, id: string, dto: UpdateTeacherDto) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    return this.prisma.teacher.update({
      where: { id },
      data: {
        fullName: dto.fullName,
        phone: dto.phone,
        qualification: dto.qualification,
        designation: dto.designation,
        specialization: dto.specialization,
      },
      include: { user: true },
    });
  }

  async deleteTeacher(schoolId: string, id: string) {
    const teacher = await this.prisma.teacher.findFirst({ where: { id, schoolId } });
    if (!teacher) throw new NotFoundException('Teacher not found');

    await this.prisma.user.delete({ where: { id: teacher.userId } });
    return { success: true, message: 'Teacher deleted successfully' };
  }
}
