import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateExamTermDto, SaveMarksDto } from './dto/marks.dto';

@Injectable()
export class MarksService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B';
    if (percentage >= 60) return 'C';
    if (percentage >= 50) return 'D';
    return 'F';
  }

  async listExamTerms(schoolId: string) {
    return this.prisma.examTerm.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createExamTerm(schoolId: string, dto: CreateExamTermDto) {
    return this.prisma.examTerm.create({
      data: {
        schoolId,
        name: dto.name,
        academicYear: dto.academicYear,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  async getSectionMarks(schoolId: string, sectionId: string, examTermId: string, subjectId: string) {
    const students = await this.prisma.student.findMany({
      where: { schoolId, sectionId, status: 'active' },
      include: {
        marks: {
          where: { examTermId, subjectId },
        },
      },
      orderBy: { fullName: 'asc' },
    });

    return students.map((s) => {
      const mark = s.marks[0];
      return {
        studentId: s.id,
        admissionNumber: s.admissionNumber,
        fullName: s.fullName,
        rollNumber: s.rollNumber,
        obtainedMarks: mark?.obtainedMarks ?? null,
        totalMarks: mark?.totalMarks ?? 100,
        grade: mark?.grade ?? null,
        comments: mark?.comments ?? '',
      };
    });
  }

  async saveMarks(schoolId: string, dto: SaveMarksDto) {
    const results = await this.prisma.$transaction(
      dto.entries.map((entry) => {
        const totalMarks = entry.totalMarks || 100;
        const percentage = (entry.obtainedMarks / totalMarks) * 100;
        const grade = this.calculateGrade(percentage);

        return this.prisma.mark.upsert({
          where: {
            examTermId_studentId_subjectId: {
              examTermId: dto.examTermId,
              studentId: entry.studentId,
              subjectId: dto.subjectId,
            },
          },
          create: {
            schoolId,
            examTermId: dto.examTermId,
            studentId: entry.studentId,
            subjectId: dto.subjectId,
            totalMarks,
            obtainedMarks: entry.obtainedMarks,
            grade,
            comments: entry.comments,
          },
          update: {
            totalMarks,
            obtainedMarks: entry.obtainedMarks,
            grade,
            comments: entry.comments,
          },
        });
      }),
    );

    return { success: true, count: results.length };
  }

  async getStudentReportCard(schoolId: string, studentId: string, examTermId: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { class: true, section: true, school: true },
    });

    if (!student) throw new NotFoundException('Student not found');

    const examTerm = await this.prisma.examTerm.findFirst({
      where: { id: examTermId, schoolId },
    });

    if (!examTerm) throw new NotFoundException('Exam term not found');

    const marks = await this.prisma.mark.findMany({
      where: { schoolId, studentId, examTermId },
      include: { subject: true },
    });

    const totalPossible = marks.reduce((sum, m) => sum + m.totalMarks, 0);
    const totalObtained = marks.reduce((sum, m) => sum + m.obtainedMarks, 0);
    const overallPercentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
    const overallGrade = this.calculateGrade(overallPercentage);

    return {
      student,
      examTerm,
      marks,
      summary: {
        totalPossible,
        totalObtained,
        percentage: Math.round(overallPercentage * 10) / 10,
        grade: overallGrade,
      },
    };
  }
}
