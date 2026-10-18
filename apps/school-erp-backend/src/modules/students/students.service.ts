import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  UpdateStudentStatusDto,
  PromoteStudentDto,
  DemoteStudentDto,
  AutoProgressionDto,
  ProgressionDecisionDto,
  ProgressionAction,
} from './dto/student.dto';
import { Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

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
      ];
    }

    const readDb = this.prisma.read || this.prisma;
    const students = await readDb.student.findMany({
      where,
      include: {
        class: true,
        section: true,
        user: { select: { status: true, avatarUrl: true, phone: true } },
        parent: true,
      },
      orderBy: { fullName: 'asc' },
    });

    return students.map((s) => {
      const parts = (s.fullName || '').trim().split(/\s+/);
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';
      return {
        ...s,
        firstName,
        lastName,
        className: s.class?.name || '',
        sectionName: s.section?.name || '',
        guardianName: s.parent?.fullName || '',
        guardianPhone: s.parent?.phone || '',
        guardianEmail: s.parent?.email || '',
      };
    });
  }

  async getStudentById(schoolId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
      include: {
        class: true,
        section: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
            phone: true,
            avatarUrl: true,
            themeColor: true,
            createdAt: true,
          },
        },
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

    const parts = (student.fullName || '').trim().split(/\s+/);
    return {
      ...student,
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      className: student.class?.name || '',
      sectionName: student.section?.name || '',
      guardianName: student.parent?.fullName || '',
      guardianPhone: student.parent?.phone || '',
      guardianEmail: student.parent?.email || '',
    };
  }

  async nextAdmissionNumber(schoolId: string) {
    const year = new Date().getFullYear();
    const count = await this.prisma.student.count({ where: { schoolId } });
    return `ADM-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  async createStudent(schoolId: string, dto: CreateStudentDto) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    const resolvedFullName = (
      dto.fullName ||
      [dto.firstName, dto.lastName].filter(Boolean).join(' ')
    ).trim();
    if (!resolvedFullName) {
      throw new BadRequestException('Student name (fullName or firstName/lastName) is required');
    }

    const admissionNumber = await this.nextAdmissionNumber(schoolId);
    const schoolDomain = `${school.code.toLowerCase().replace(/[^a-z0-9]/g, '')}.edu`;
    const slug = admissionNumber.toLowerCase().replace(/[^a-z0-9]/g, '');

    const rawStudentEmail = dto.email || dto.studentContactEmail || `${slug}@${schoolDomain}`;
    const studentEmail = rawStudentEmail.toLowerCase().trim();

    const resolvedParentName = (dto.parentName || dto.guardianName || `Guardian of ${resolvedFullName}`).trim();
    const resolvedParentPhone = dto.parentPhone || dto.guardianPhone;
    const rawParentEmail =
      dto.parentEmail ||
      (dto.guardianEmail && dto.guardianEmail.trim() ? dto.guardianEmail : `parent.${slug}@${schoolDomain}`);
    const parentEmail = rawParentEmail.toLowerCase().trim();

    const existingStudentUser = await this.prisma.user.findUnique({ where: { email: studentEmail } });
    if (existingStudentUser) {
      throw new ConflictException(`Student user with email ${studentEmail} already exists`);
    }

    const defaultPassword = dto.password || 'Student@123';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    return this.prisma.$transaction(async (tx) => {
      // 1. Create or link parent user
      let parentUser = await tx.user.findUnique({ where: { email: parentEmail } });
      let parentRecord = null;

      if (!parentUser) {
        const parentPassHash = await bcrypt.hash('Parent@123', 10);
        parentUser = await tx.user.create({
          data: {
            schoolId,
            name: resolvedParentName,
            email: parentEmail,
            passwordHash: parentPassHash,
            role: Role.PARENT,
            phone: resolvedParentPhone,
            status: UserStatus.ACTIVE,
          },
        });
      }

      parentRecord = await tx.parent.findUnique({ where: { userId: parentUser.id } });
      if (!parentRecord) {
        parentRecord = await tx.parent.create({
          data: {
            userId: parentUser.id,
            fullName: resolvedParentName,
            email: parentEmail,
            phone: resolvedParentPhone,
            relationship: dto.relationship || 'Guardian',
          },
        });
      }

      // 2. Create student user
      const studentUser = await tx.user.create({
        data: {
          schoolId,
          name: resolvedFullName,
          email: studentEmail,
          passwordHash,
          role: Role.STUDENT,
          avatarUrl: dto.photoUrl,
          status: UserStatus.ACTIVE,
        },
      });

      // 3. Create student profile
      const student = await tx.student.create({
        data: {
          schoolId,
          userId: studentUser.id,
          admissionNumber,
          fullName: resolvedFullName,
          email: studentEmail,
          photoUrl: dto.photoUrl,
          classId: dto.classId,
          sectionId: dto.sectionId,
          rollNumber: dto.rollNumber,
          dob: dto.dob ? new Date(dto.dob) : undefined,
          gender: dto.gender,
          address: dto.address,
          emergencyContact: dto.emergencyContact || resolvedParentPhone,
          discountPercentage: dto.discountPercentage || 0,
          customMonthlyFee: dto.customMonthlyFee,
          discountReason: dto.discountReason,
          parentId: parentRecord.id,
          status: 'active',
        },
        include: {
          class: true,
          section: true,
          parent: true,
        },
      });

      await this.redisService.del(`dashboard:stats:${schoolId}`);
      this.logger.log(`🎓 [StudentsService] Created student "${student.fullName}" (ADM: ${student.admissionNumber})`);

      return {
        ...student,
        generatedEmail: studentEmail,
        generatedPassword: defaultPassword,
      };
    });
  }

  async updateStudent(schoolId: string, id: string, dto: UpdateStudentDto) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const updateData: any = {};
    const resolvedFullName =
      dto.fullName ||
      (dto.firstName || dto.lastName
        ? [dto.firstName, dto.lastName].filter(Boolean).join(' ').trim()
        : undefined);
    if (resolvedFullName) updateData.fullName = resolvedFullName;
    if (dto.classId) updateData.classId = dto.classId;
    if (dto.sectionId) updateData.sectionId = dto.sectionId;
    if (dto.rollNumber !== undefined) updateData.rollNumber = dto.rollNumber;
    if (dto.photoUrl !== undefined) updateData.photoUrl = dto.photoUrl;
    if (dto.dob) updateData.dob = new Date(dto.dob);
    if (dto.gender) updateData.gender = dto.gender;
    if (dto.address !== undefined) updateData.address = dto.address;
    if (dto.emergencyContact !== undefined) updateData.emergencyContact = dto.emergencyContact;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.discountPercentage !== undefined) updateData.discountPercentage = dto.discountPercentage;
    if (dto.customMonthlyFee !== undefined) updateData.customMonthlyFee = dto.customMonthlyFee;
    if (dto.discountReason !== undefined) updateData.discountReason = dto.discountReason;

    // Update linked parent/guardian details if provided
    if (student.parentId && (dto.guardianName || dto.parentName || dto.guardianPhone || dto.parentPhone || dto.guardianEmail || dto.parentEmail)) {
      const parentUpdate: any = {};
      if (dto.guardianName || dto.parentName) parentUpdate.fullName = dto.guardianName || dto.parentName;
      if (dto.guardianPhone !== undefined || dto.parentPhone !== undefined) {
        parentUpdate.phone = dto.guardianPhone ?? dto.parentPhone;
      }
      if (dto.guardianEmail || dto.parentEmail) parentUpdate.email = dto.guardianEmail || dto.parentEmail;
      await this.prisma.parent.update({
        where: { id: student.parentId },
        data: parentUpdate,
      });
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: updateData,
      include: { class: true, section: true, parent: true },
    });

    await this.redisService.del(`dashboard:stats:${schoolId}`);
    return updated;
  }

  async updateStatus(schoolId: string, id: string, dto: UpdateStudentStatusDto) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const updated = await this.prisma.student.update({
      where: { id },
      data: { status: dto.status },
    });

    await this.redisService.del(`dashboard:stats:${schoolId}`);
    return updated;
  }

  async deleteStudent(schoolId: string, id: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
    });
    if (!student) throw new NotFoundException('Student not found');

    await this.prisma.user.delete({ where: { id: student.userId } });
    await this.redisService.del(`dashboard:stats:${schoolId}`);
    return { success: true, message: 'Student deleted successfully' };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Promotion & Demotion Engine
  // ─────────────────────────────────────────────────────────────────────────

  async promoteStudent(schoolId: string, id: string, dto: PromoteStudentDto) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
      include: { class: true, section: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    let targetClassId = dto.targetClassId;
    let targetSectionId = dto.targetSectionId;

    if (!targetClassId) {
      // Find the next class grade (currentGrade + 1)
      const nextGrade = student.class.grade + 1;
      const nextClass = await this.prisma.class.findFirst({
        where: { schoolId, grade: nextGrade },
        include: { sections: true },
      });

      if (!nextClass) {
        throw new BadRequestException(
          `Cannot auto-promote: No class exists for Grade ${nextGrade}. Please create Grade ${nextGrade} first or select a specific target class.`,
        );
      }

      targetClassId = nextClass.id;
      targetSectionId = nextClass.sections[0]?.id;
    }

    if (!targetSectionId) {
      const section = await this.prisma.section.findFirst({ where: { classId: targetClassId } });
      if (!section) throw new BadRequestException('Target class has no sections configured.');
      targetSectionId = section.id;
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        classId: targetClassId,
        sectionId: targetSectionId,
      },
      include: { class: true, section: true },
    });

    await this.redisService.del(`dashboard:stats:${schoolId}`);

    return {
      success: true,
      message: `${student.fullName} promoted from ${student.class.name} to ${updated.class.name} (${updated.section.name}).`,
      student: updated,
    };
  }

  async demoteStudent(schoolId: string, id: string, dto: DemoteStudentDto) {
    const student = await this.prisma.student.findFirst({
      where: { id, schoolId },
      include: { class: true, section: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    let targetClassId = dto.targetClassId;
    let targetSectionId = dto.targetSectionId;

    if (!targetClassId) {
      // Find the previous class grade (currentGrade - 1)
      const prevGrade = student.class.grade - 1;
      if (prevGrade < 1) {
        throw new BadRequestException('Cannot demote below Grade 1.');
      }

      const prevClass = await this.prisma.class.findFirst({
        where: { schoolId, grade: prevGrade },
        include: { sections: true },
      });

      if (!prevClass) {
        throw new BadRequestException(
          `Cannot auto-demote: No class exists for Grade ${prevGrade}. Please select a target class manually.`,
        );
      }

      targetClassId = prevClass.id;
      targetSectionId = prevClass.sections[0]?.id;
    }

    if (!targetSectionId) {
      const section = await this.prisma.section.findFirst({ where: { classId: targetClassId } });
      if (!section) throw new BadRequestException('Target class has no sections configured.');
      targetSectionId = section.id;
    }

    const updated = await this.prisma.student.update({
      where: { id },
      data: {
        classId: targetClassId,
        sectionId: targetSectionId,
      },
      include: { class: true, section: true },
    });

    await this.redisService.del(`dashboard:stats:${schoolId}`);

    return {
      success: true,
      message: `${student.fullName} demoted from ${student.class.name} to ${updated.class.name} (${updated.section.name}).`,
      student: updated,
    };
  }

  async autoProgressAcademicYear(schoolId: string, dto: AutoProgressionDto) {
    const threshold = dto.passingThreshold || 40;
    const examTerm = await this.prisma.examTerm.findFirst({
      where: { id: dto.finalExamTermId, schoolId },
    });
    if (!examTerm) throw new NotFoundException('Final exam term not found');

    // Get all active students with their marks in this exam term
    const students = await this.prisma.student.findMany({
      where: { schoolId, status: 'active' },
      include: {
        class: true,
        section: true,
        marks: {
          where: { examTermId: dto.finalExamTermId },
        },
      },
      orderBy: [{ class: { grade: 'asc' } }, { fullName: 'asc' }],
    });

    const passedStudents: any[] = [];
    const failedOrReviewStudents: any[] = [];

    students.forEach((st) => {
      const totalPossible = st.marks.reduce((sum, m) => sum + m.totalMarks, 0);
      const totalObtained = st.marks.reduce((sum, m) => sum + m.obtainedMarks, 0);
      const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
      const failingCount = st.marks.filter((m) => m.obtainedMarks < m.totalMarks * (threshold / 100)).length;

      const info = {
        studentId: st.id,
        admissionNumber: st.admissionNumber,
        fullName: st.fullName,
        currentClassName: st.class.name,
        currentGrade: st.class.grade,
        currentSectionName: st.section.name,
        totalSubjects: st.marks.length,
        percentage: Math.round(percentage * 10) / 10,
        failingSubjects: failingCount,
      };

      if (percentage >= threshold && failingCount === 0) {
        passedStudents.push(info);
      } else {
        failedOrReviewStudents.push({
          ...info,
          suggestedAction: failingCount >= 2 || percentage < 35 ? 'RETAIN' : 'PROMOTE_WITH_GRACE',
        });
      }
    });

    // If auto-promote is enabled, promote passing students in batch
    let autoPromotedCount = 0;
    if (dto.autoPromotePassing !== false) {
      for (const st of passedStudents) {
        try {
          await this.promoteStudent(schoolId, st.studentId, {});
          autoPromotedCount++;
        } catch {
          // Graduating or no higher class (e.g. Grade 12 or max grade)
        }
      }
    }

    return {
      success: true,
      examTermName: examTerm.name,
      passingThreshold: threshold,
      totalEvaluated: students.length,
      autoPromotedCount,
      passedStudentsCount: passedStudents.length,
      actionRequiredStudents: failedOrReviewStudents,
    };
  }

  async applyProgressionDecisions(schoolId: string, decisions: ProgressionDecisionDto[]) {
    const results = [];
    for (const dec of decisions) {
      if (dec.action === ProgressionAction.PROMOTE) {
        const res = await this.promoteStudent(schoolId, dec.studentId, {
          targetClassId: dec.targetClassId,
          targetSectionId: dec.targetSectionId,
        });
        results.push(res);
      } else if (dec.action === ProgressionAction.DEMOTE) {
        const res = await this.demoteStudent(schoolId, dec.studentId, {
          targetClassId: dec.targetClassId,
          targetSectionId: dec.targetSectionId,
        });
        results.push(res);
      } else {
        // Retain in same class
        results.push({
          success: true,
          message: `Student retained in current class.`,
          studentId: dec.studentId,
        });
      }
    }

    return {
      success: true,
      processed: results.length,
      results,
    };
  }
}
