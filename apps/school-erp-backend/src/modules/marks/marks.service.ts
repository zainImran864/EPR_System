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
      include: {
        class: true,
        section: true,
        school: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    const examTerm = await this.prisma.examTerm.findFirst({
      where: { id: examTermId, schoolId },
    });

    if (!examTerm) throw new NotFoundException('Exam term not found');

    const marks = await this.prisma.mark.findMany({
      where: {
        schoolId,
        studentId,
        examTermId,
      },
      include: {
        subject: true,
      },
    });

    const totalPossible = marks.reduce((sum, m) => sum + m.totalMarks, 0);
    const totalObtained = marks.reduce((sum, m) => sum + m.obtainedMarks, 0);
    const overallPercentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
    const overallGrade = this.calculateGrade(overallPercentage);

    return {
      student: {
        id: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        className: student.class.name,
        sectionName: student.section.name,
      },
      school: {
        name: student.school.name,
        code: student.school.code,
        logoUrl: student.school.logoUrl,
        address: student.school.address,
        phone: student.school.phone,
        email: student.school.email,
      },
      examTerm: {
        id: examTerm.id,
        name: examTerm.name,
        academicYear: examTerm.academicYear,
      },
      subjects: marks.map((m) => ({
        subjectName: m.subject.name,
        code: m.subject.code,
        totalMarks: m.totalMarks,
        obtainedMarks: m.obtainedMarks,
        percentage: (m.obtainedMarks / m.totalMarks) * 100,
        grade: m.grade,
        comments: m.comments,
      })),
      summary: {
        totalPossible,
        totalObtained,
        overallPercentage: Math.round(overallPercentage * 10) / 10,
        overallGrade,
      },
    };
  }

  async getExamAnalytics(schoolId: string, examTermId: string, sectionId?: string) {
    const examTerm = await this.prisma.examTerm.findFirst({
      where: { id: examTermId, schoolId },
    });
    if (!examTerm) throw new NotFoundException('Exam term not found');

    const marks = await this.prisma.mark.findMany({
      where: {
        schoolId,
        examTermId,
        ...(sectionId ? { student: { sectionId } } : {}),
      },
      include: {
        student: {
          include: {
            class: true,
            section: true,
          },
        },
        subject: true,
      },
    });

    if (marks.length === 0) {
      return {
        examTermName: examTerm.name,
        totalEntries: 0,
        averageScore: 0,
        passPercentage: 0,
        gradeDistribution: { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 },
        subjectAnalytics: [],
        atRiskStudents: [],
      };
    }

    // 1. Grade distribution
    const gradeCounts: Record<string, number> = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    marks.forEach((m) => {
      const g = m.grade || 'F';
      if (gradeCounts[g] !== undefined) gradeCounts[g]++;
    });

    // 2. Aggregate per student
    const studentAggregates: Record<
      string,
      {
        studentId: string;
        name: string;
        admissionNumber: string;
        className: string;
        sectionName: string;
        totalObtained: number;
        totalPossible: number;
        failingSubjectsCount: number;
      }
    > = {};

    marks.forEach((m) => {
      if (!studentAggregates[m.studentId]) {
        studentAggregates[m.studentId] = {
          studentId: m.studentId,
          name: m.student.fullName,
          admissionNumber: m.student.admissionNumber,
          className: m.student.class.name,
          sectionName: m.student.section.name,
          totalObtained: 0,
          totalPossible: 0,
          failingSubjectsCount: 0,
        };
      }
      studentAggregates[m.studentId].totalObtained += m.obtainedMarks;
      studentAggregates[m.studentId].totalPossible += m.totalMarks;
      if (m.obtainedMarks < m.totalMarks * 0.4) {
        studentAggregates[m.studentId].failingSubjectsCount++;
      }
    });

    const studentList = Object.values(studentAggregates).map((s) => {
      const pct = s.totalPossible > 0 ? (s.totalObtained / s.totalPossible) * 100 : 0;
      return {
        ...s,
        percentage: Math.round(pct * 10) / 10,
        grade: this.calculateGrade(pct),
      };
    });

    studentList.sort((a, b) => b.percentage - a.percentage);

    // Top performers (top 3)
    const topPerformers = studentList.slice(0, 3);

    // At-risk students (score < 50% or failing in 1+ subjects)
    const atRiskStudents = studentList
      .filter((s) => s.percentage < 50 || s.failingSubjectsCount > 0)
      .map((s) => ({
        ...s,
        riskLevel: s.percentage < 40 || s.failingSubjectsCount >= 2 ? 'HIGH' : 'MEDIUM',
        recommendedAction:
          s.failingSubjectsCount >= 2
            ? 'Parent-Teacher conference & remedial tutoring'
            : 'Subject revision session recommended',
      }));

    // 3. Subject-wise performance
    const subjectMap: Record<
      string,
      {
        subjectName: string;
        totalObtained: number;
        totalPossible: number;
        count: number;
        passCount: number;
      }
    > = {};

    marks.forEach((m) => {
      const sub = m.subject.name;
      if (!subjectMap[sub]) {
        subjectMap[sub] = {
          subjectName: sub,
          totalObtained: 0,
          totalPossible: 0,
          count: 0,
          passCount: 0,
        };
      }
      subjectMap[sub].totalObtained += m.obtainedMarks;
      subjectMap[sub].totalPossible += m.totalMarks;
      subjectMap[sub].count++;
      if (m.obtainedMarks >= m.totalMarks * 0.4) {
        subjectMap[sub].passCount++;
      }
    });

    const subjectAnalytics = Object.values(subjectMap).map((sm) => {
      const avgPct = sm.totalPossible > 0 ? (sm.totalObtained / sm.totalPossible) * 100 : 0;
      const passRate = sm.count > 0 ? (sm.passCount / sm.count) * 100 : 0;
      return {
        subjectName: sm.subjectName,
        averagePercentage: Math.round(avgPct * 10) / 10,
        passRate: Math.round(passRate * 10) / 10,
        difficulty: avgPct < 60 ? 'CHALLENGING' : avgPct < 80 ? 'MODERATE' : 'ACCESSIBLE',
      };
    });

    const totalStudents = studentList.length;
    const passedStudents = studentList.filter((s) => s.percentage >= 40).length;
    const passPercentage = totalStudents > 0 ? (passedStudents / totalStudents) * 100 : 0;
    const totalScorePct = studentList.reduce((sum, s) => sum + s.percentage, 0);
    const averageScore = totalStudents > 0 ? totalScorePct / totalStudents : 0;

    return {
      examTermName: examTerm.name,
      academicYear: examTerm.academicYear,
      totalStudentsAppeared: totalStudents,
      averageScore: Math.round(averageScore * 10) / 10,
      passPercentage: Math.round(passPercentage * 10) / 10,
      gradeDistribution: gradeCounts,
      topPerformers,
      atRiskStudents,
      subjectAnalytics,
    };
  }

  async getBatchReportCards(schoolId: string, examTermId: string, sectionId: string) {
    const students = await this.prisma.student.findMany({
      where: { schoolId, sectionId, status: 'active' },
      select: { id: true },
    });

    const reportCards = await Promise.all(
      students.map((s) => this.getStudentReportCard(schoolId, s.id, examTermId)),
    );

    // Rank students by overall percentage
    reportCards.sort((a, b) => b.summary.overallPercentage - a.summary.overallPercentage);

    return reportCards.map((rc, index) => ({
      ...rc,
      summary: {
        ...rc.summary,
        classRank: index + 1,
        totalInClass: reportCards.length,
      },
    }));
  }
}
