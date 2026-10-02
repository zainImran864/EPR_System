import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateStudentDto, UpdateStudentDto, UpdateStudentStatusDto } from './dto/student.dto';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
  constructor(private readonly prisma: PrismaService) {}

  async listStudents(
    schoolId: string,
    query: {
      classId?: string;
      sectionId?: string;
      status?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const where: any = { schoolId };

    if (query.classId) where.classId = query.classId;
    if (query.sectionId) where.sectionId = query.sectionId;
    if (query.status) where.status = query.status;

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { admissionNumber: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { parentName: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const students = await this.prisma.student.findMany({
      where,
      include: {
        class: true,
        section: true,
        user: { select: { status: true, avatarUrl: true, phone: true } },
        parent: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return students;
  }

  async getStudentById(schoolId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
      include: {
        class: true,
        section: true,
        user: true,
        parent: true,
        marks: {
          include: { examTerm: true, subject: true },
        },
        attendances: {
          orderBy: { date: 'desc' },
          take: 30,
        },
        feeChallans: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    return student;
  }

  async nextAdmissionNumber(schoolId: string) {
    const year = new Date().getFullYear();
    const count = await this.prisma.student.count({ where: { schoolId } });
    return `ADM-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  async createStudent(schoolId: string, dto: CreateStudentDto) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    const studentEmail = dto.email.toLowerCase().trim();
    const parentEmail = dto.parentEmail.toLowerCase().trim();

    const existingStudentUser = await this.prisma.user.findUnique({ where: { email: studentEmail } });
    if (existingStudentUser) {
      throw new ConflictException(`Student user with email ${studentEmail} already exists`);
    }

    const admissionNumber = await this.nextAdmissionNumber(schoolId);
    const defaultPassword = dto.password || 'Student@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create or link Parent account
      let parentUser = await tx.user.findUnique({ where: { email: parentEmail } });
      let parentRecord = null;

      if (!parentUser) {
        parentUser = await tx.user.create({
          data: {
            schoolId,
            name: dto.parentName,
            email: parentEmail,
            passwordHash,
            role: Role.PARENT,
            status: UserStatus.ACTIVE,
            phone: dto.parentPhone,
            mustChangePassword: true,
          },
        });

        parentRecord = await tx.parent.create({
          data: {
            userId: parentUser.id,
            fullName: dto.parentName,
            email: parentEmail,
            phone: dto.parentPhone,
            relationship: dto.relationship || 'Guardian',
          },
        });
      } else {
        parentRecord = await tx.parent.findUnique({ where: { userId: parentUser.id } });
      }

      // 2. Create Student User Account
      const studentUser = await tx.user.create({
        data: {
          schoolId,
          name: dto.fullName,
          email: studentEmail,
          passwordHash,
          role: Role.STUDENT,
          status: UserStatus.ACTIVE,
          phone: dto.emergencyContact,
          mustChangePassword: true,
        },
      });

      // 3. Create Student Profile
      const student = await tx.student.create({
        data: {
          schoolId,
          userId: studentUser.id,
          admissionNumber,
          fullName: dto.fullName,
          email: studentEmail,
          classId: dto.classId,
          sectionId: dto.sectionId,
          rollNumber: dto.rollNumber,
          dob: dto.dob ? new Date(dto.dob) : undefined,
          gender: dto.gender,
          address: dto.address,
          emergencyContact: dto.emergencyContact,
          parentId: parentRecord?.id,
          status: 'active',
        },
        include: { class: true, section: true, user: true, parent: true },
      });

      return student;
    });
  }

  async updateStudent(schoolId: string, id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findFirst({ where: { id, schoolId } });
    if (!student) throw new NotFoundException('Student not found');

    return this.prisma.student.update({
      where: { id },
      data: dto,
      include: { class: true, section: true, user: true, parent: true },
    });
  }

  async updateStatus(schoolId: string, id: string, dto: UpdateStudentStatusDto) {
    const student = await this.prisma.student.findFirst({ where: { id, schoolId } });
    if (!student) throw new NotFoundException('Student not found');

    const updated = await this.prisma.student.update({
      where: { id },
      data: { status: dto.status },
    });

    const userStatus = dto.status === 'active' ? UserStatus.ACTIVE : UserStatus.INACTIVE;
    await this.prisma.user.update({
      where: { id: student.userId },
      data: { status: userStatus },
    });

    return updated;
  }

  async deleteStudent(schoolId: string, id: string) {
    const student = await this.prisma.student.findFirst({ where: { id, schoolId } });
    if (!student) throw new NotFoundException('Student not found');

    await this.prisma.user.delete({ where: { id: student.userId } });
    return { success: true, message: 'Student and linked login deleted successfully' };
  }
}
