import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateExamTermDto,
  SaveMarksDto,
  SavePaperSchedulesDto,
  CreateQuestionPaperDto,
} from './dto/marks.dto';

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
      include: {
        _count: {
          select: { marks: true, paperSchedules: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createExamTerm(schoolId: string, dto: CreateExamTermDto) {
    return this.prisma.examTerm.create({
      data: {
        schoolId,
        name: dto.name,
        termType: dto.termType || 'MID_TERM',
        academicYear: dto.academicYear,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Paper Date-Sheet & Exam Timetable
  // ─────────────────────────────────────────────────────────────────────────

  async savePaperSchedules(schoolId: string, dto: SavePaperSchedulesDto) {
    const examTerm = await this.prisma.examTerm.findFirst({
      where: { id: dto.examTermId, schoolId },
    });
    if (!examTerm) throw new NotFoundException('Exam term not found');

    // Remove existing schedules for this class & exam term to replace cleanly
    await this.prisma.examPaperSchedule.deleteMany({
      where: {
        examTermId: dto.examTermId,
        classId: dto.classId,
      },
    });

    const created = await this.prisma.$transaction(
      dto.schedules.map((s) =>
        this.prisma.examPaperSchedule.create({
          data: {
            examTermId: dto.examTermId,
            classId: dto.classId,
            subjectId: s.subjectId,
            examDate: new Date(s.examDate),
            startTime: s.startTime,
            endTime: s.endTime,
            roomNo: s.roomNo || 'Main Examination Hall',
            totalMarks: s.totalMarks || 100,
          },
        }),
      ),
    );

    return {
      success: true,
      count: created.length,
      message: `Date sheet saved with ${created.length} paper schedules.`,
    };
  }

  async getPaperSchedules(schoolId: string, examTermId: string, classId: string) {
    return this.prisma.examPaperSchedule.findMany({
      where: {
        examTermId,
        classId,
        examTerm: { schoolId },
      },
      include: {
        subject: true,
        class: true,
      },
      orderBy: { examDate: 'asc' },
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Roll Number & Admit Card Slips Generation
  // ─────────────────────────────────────────────────────────────────────────

  async generateRollNoSlips(
    schoolId: string,
    examTermId: string,
    classId: string,
    sectionId?: string,
  ) {
    const examTerm = await this.prisma.examTerm.findFirst({
      where: { id: examTermId, schoolId },
      include: { school: true },
    });
    if (!examTerm) throw new NotFoundException('Exam term not found');

    const dateSheet = await this.prisma.examPaperSchedule.findMany({
      where: { examTermId, classId },
      include: { subject: true },
      orderBy: { examDate: 'asc' },
    });

    const where: any = { schoolId, classId, status: 'active' };
    if (sectionId) where.sectionId = sectionId;

    const students = await this.prisma.student.findMany({
      where,
      include: { class: true, section: true },
      orderBy: { rollNumber: 'asc' },
    });

    return students.map((st, idx) => ({
      slipType: 'STANDARD_EXAM',
      examTerm: {
        id: examTerm.id,
        name: examTerm.name,
        termType: examTerm.termType,
        academicYear: examTerm.academicYear,
      },
      school: {
        name: examTerm.school.name,
        code: examTerm.school.code,
        logoUrl: examTerm.school.logoUrl,
        address: examTerm.school.address,
        phone: examTerm.school.phone,
      },
      student: {
        id: st.id,
        fullName: st.fullName,
        admissionNumber: st.admissionNumber,
        rollNumber: st.rollNumber || String(idx + 1).padStart(3, '0'),
        photoUrl: st.photoUrl,
        className: st.class.name,
        sectionName: st.section.name,
        seatNumber: `SEAT-${st.class.name.replace(/\s+/g, '')}-${st.rollNumber || idx + 1}`,
      },
      dateSheet: dateSheet.map((ds) => ({
        subjectName: ds.subject.name,
        code: ds.subject.code,
        examDate: ds.examDate.toISOString().split('T')[0],
        dayOfWeek: ds.examDate.toLocaleDateString('en-US', { weekday: 'long' }),
        timing: `${ds.startTime} – ${ds.endTime}`,
        roomNo: ds.roomNo,
        totalMarks: ds.totalMarks,
      })),
      instructions: [
        'Candidates must bring this original Roll Number Slip and school ID to the examination hall.',
        'Arrival time is strictly 20 minutes prior to the commencement of each paper.',
        'Electronic devices, smartwatches, and programmable calculators are strictly forbidden.',
        'Impersonation or unfair means will result in immediate disqualification and cancellation of results.',
      ],
    }));
  }

  async generateSingleRollNoSlip(
    schoolId: string,
    examTermId: string,
    studentId: string,
    isRetake: boolean = false,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: { class: true, section: true, school: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    const examTerm = await this.prisma.examTerm.findFirst({
      where: { id: examTermId, schoolId },
    });
    if (!examTerm) throw new NotFoundException('Exam term not found');

    const dateSheet = await this.prisma.examPaperSchedule.findMany({
      where: { examTermId, classId: student.classId },
      include: { subject: true },
      orderBy: { examDate: 'asc' },
    });

    return {
      slipType: isRetake ? 'RETAKE_SUPPLEMENTARY' : 'SINGLE_CANDIDATE',
      isRetake,
      examTerm: {
        id: examTerm.id,
        name: isRetake ? `${examTerm.name} (Supplementary / Re-Take)` : examTerm.name,
        academicYear: examTerm.academicYear,
      },
      school: {
        name: student.school.name,
        code: student.school.code,
        logoUrl: student.school.logoUrl,
        address: student.school.address,
        phone: student.school.phone,
      },
      student: {
        id: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        photoUrl: student.photoUrl,
        className: student.class.name,
        sectionName: student.section.name,
        seatNumber: `SEAT-${student.class.name.replace(/\s+/g, '')}-${student.rollNumber || '01'}`,
      },
      dateSheet: dateSheet.map((ds) => ({
        subjectName: ds.subject.name,
        code: ds.subject.code,
        examDate: ds.examDate.toISOString().split('T')[0],
        dayOfWeek: ds.examDate.toLocaleDateString('en-US', { weekday: 'long' }),
        timing: `${ds.startTime} – ${ds.endTime}`,
        roomNo: ds.roomNo,
        totalMarks: ds.totalMarks,
      })),
      instructions: [
        isRetake
          ? 'Special Re-Take / Supplementary Examination Permit. Verify paper code before entry.'
          : 'Candidate must present this slip for verification at examination entry.',
        'Reporting time: 20 minutes before scheduled start.',
        'Unfair means and mobile devices are strictly barred from the examination hall.',
      ],
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Marks Roster & Grading
  // ─────────────────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────────────────
  // Teacher Context & RBAC Permissions
  // ─────────────────────────────────────────────────────────────────────────

  async getTeacherContext(schoolId: string, userId: string, role: string) {
    if (role !== 'TEACHER') {
      return {
        isTeacher: false,
        isClassTeacher: false,
        classTeacherSections: [],
        taughtSubjects: [],
      };
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: { userId, schoolId },
      include: {
        classTeacherSections: {
          include: { class: true },
        },
        timetables: {
          include: {
            subject: true,
            section: { include: { class: true } },
          },
        },
      },
    });

    if (!teacher) {
      return {
        isTeacher: true,
        isClassTeacher: false,
        classTeacherSections: [],
        taughtSubjects: [],
      };
    }

    const classTeacherSections = teacher.classTeacherSections.map((s) => ({
      sectionId: s.id,
      sectionName: s.name,
      classId: s.classId,
      className: s.class.name,
    }));

    // Deduplicate taught subjects across timetable entries
    const taughtMap = new Map<string, any>();
    teacher.timetables.forEach((t) => {
      const key = `${t.section.classId}_${t.sectionId}_${t.subjectId}`;
      if (!taughtMap.has(key)) {
        taughtMap.set(key, {
          classId: t.section.classId,
          className: t.section.class.name,
          sectionId: t.sectionId,
          sectionName: t.section.name,
          subjectId: t.subjectId,
          subjectName: t.subject.name,
        });
      }
    });

    return {
      isTeacher: true,
      teacherId: teacher.id,
      teacherName: teacher.fullName,
      isClassTeacher: classTeacherSections.length > 0,
      classTeacherSections,
      taughtSubjects: Array.from(taughtMap.values()),
    };
  }

  async saveMarks(
    schoolId: string,
    userPayload: { userId: string; role: string },
    dto: SaveMarksDto,
  ) {
    // Academic Integrity Rule: Admin cannot directly modify subject exam scores
    if (userPayload.role === 'ADMIN' || userPayload.role === 'SUPER_ADMIN') {
      throw new ForbiddenException(
        'Direct score modifications by administrators are restricted. Marks must be submitted by the assigned Subject Teacher.',
      );
    }

    // If caller is Teacher: Validate that this teacher actually teaches the subject
    if (userPayload.role === 'TEACHER') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: userPayload.userId, schoolId },
      });
      if (!teacher) {
        throw new ForbiddenException('Teacher profile not found for this account.');
      }

      // Check timetable entry or direct subject assignment
      const teachesSubject = await this.prisma.timetableEntry.findFirst({
        where: {
          teacherId: teacher.id,
          subjectId: dto.subjectId,
          schoolId,
        },
      });

      // If timetable is configured, strictly enforce subject assignment
      const anyTimetableForTeacher = await this.prisma.timetableEntry.findFirst({
        where: { teacherId: teacher.id, schoolId },
      });

      if (anyTimetableForTeacher && !teachesSubject) {
        throw new ForbiddenException(
          'Unauthorized: You are only permitted to enter or update marks for your own assigned subject.',
        );
      }
    }

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

    return {
      success: true,
      count: results.length,
      message: `Successfully saved marks for ${results.length} students.`,
    };
  }

  async getStudentReportCard(schoolId: string, studentId: string, examTermId?: string) {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, schoolId },
      include: {
        class: true,
        section: true,
        school: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    // If examTermId is provided, generate Term-Specific Report Card
    if (examTermId) {
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

      return {
        reportType: 'TERM_WISE',
        student: {
          id: student.id,
          fullName: student.fullName,
          admissionNumber: student.admissionNumber,
          rollNumber: student.rollNumber,
          photoUrl: student.photoUrl,
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
          termType: examTerm.termType,
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
          overallGrade: this.calculateGrade(overallPercentage),
        },
      };
    }

    // Otherwise, generate Comprehensive Full-Year Cumulative Report Card across all terms
    const allMarks = await this.prisma.mark.findMany({
      where: { schoolId, studentId },
      include: { subject: true, examTerm: true },
      orderBy: { examTerm: { createdAt: 'asc' } },
    });

    const termsMap: Record<string, { termName: string; marks: any[]; totalPossible: number; totalObtained: number }> = {};

    allMarks.forEach((m) => {
      const termName = m.examTerm.name;
      if (!termsMap[termName]) {
        termsMap[termName] = {
          termName,
          marks: [],
          totalPossible: 0,
          totalObtained: 0,
        };
      }
      termsMap[termName].marks.push({
        subjectName: m.subject.name,
        totalMarks: m.totalMarks,
        obtainedMarks: m.obtainedMarks,
        grade: m.grade,
      });
      termsMap[termName].totalPossible += m.totalMarks;
      termsMap[termName].totalObtained += m.obtainedMarks;
    });

    const grandPossible = allMarks.reduce((sum, m) => sum + m.totalMarks, 0);
    const grandObtained = allMarks.reduce((sum, m) => sum + m.obtainedMarks, 0);
    const grandPercentage = grandPossible > 0 ? (grandObtained / grandPossible) * 100 : 0;

    return {
      reportType: 'FULL_YEAR_CUMULATIVE',
      student: {
        id: student.id,
        fullName: student.fullName,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        photoUrl: student.photoUrl,
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
      academicYear: '2026-2027',
      terms: Object.values(termsMap).map((t) => ({
        ...t,
        percentage: t.totalPossible > 0 ? Math.round((t.totalObtained / t.totalPossible) * 1000) / 10 : 0,
        grade: this.calculateGrade(t.totalPossible > 0 ? (t.totalObtained / t.totalPossible) * 100 : 0),
      })),
      summary: {
        grandPossible,
        grandObtained,
        grandPercentage: Math.round(grandPercentage * 10) / 10,
        grandGrade: this.calculateGrade(grandPercentage),
        status: grandPercentage >= 40 ? 'PROMOTED' : 'NEEDS_IMPROVEMENT',
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
          include: { class: true, section: true },
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

    const gradeCounts: Record<string, number> = { 'A+': 0, A: 0, B: 0, C: 0, D: 0, F: 0 };
    marks.forEach((m) => {
      const g = m.grade || 'F';
      if (gradeCounts[g] !== undefined) gradeCounts[g]++;
    });

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

    const topPerformers = studentList.slice(0, 3);
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

  // ─────────────────────────────────────────────────────────────────────────
  // Exam Question Papers Management & Official Printable Paper Generation
  // ─────────────────────────────────────────────────────────────────────────

  async createQuestionPaper(
    schoolId: string,
    userPayload: { userId: string; role: string },
    dto: CreateQuestionPaperDto,
  ) {
    let teacherId: string;

    if (userPayload.role === 'TEACHER') {
      const teacher = await this.prisma.teacher.findFirst({
        where: { userId: userPayload.userId, schoolId },
      });
      if (!teacher) throw new NotFoundException('Teacher profile not found');
      teacherId = teacher.id;
    } else {
      // If admin, find assigned teacher or first teacher for subject
      const assigned = await this.prisma.timetableEntry.findFirst({
        where: { subjectId: dto.subjectId, schoolId },
        include: { teacher: true },
      });
      if (assigned) {
        teacherId = assigned.teacherId;
      } else {
        const firstTeacher = await this.prisma.teacher.findFirst({
          where: { schoolId },
        });
        if (!firstTeacher) throw new NotFoundException('No teacher available to assign as paper setter.');
        teacherId = firstTeacher.id;
      }
    }

    // Determine version number
    const count = await this.prisma.examQuestionPaper.count({
      where: {
        schoolId,
        examTermId: dto.examTermId,
        classId: dto.classId,
        subjectId: dto.subjectId,
      },
    });

    const isFirstPaper = count === 0;

    const paper = await this.prisma.examQuestionPaper.create({
      data: {
        schoolId,
        examTermId: dto.examTermId,
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId,
        title: dto.title,
        durationHours: dto.durationHours || 2.5,
        totalMarks: dto.totalMarks || 100,
        instructions:
          dto.instructions ||
          '1. Write your Name, Roll Number, and Section clearly.\n2. Attempt all questions as indicated.\n3. Calculators and unauthorized electronic devices are strictly prohibited.\n4. Write all answers legibly on the provided answer booklet.',
        fileUrl: dto.fileUrl,
        questionsJson: dto.questionsJson,
        status: 'SUBMITTED',
        isActiveForExam: isFirstPaper,
        version: count + 1,
      },
      include: {
        subject: true,
        class: true,
        teacher: true,
        examTerm: true,
      },
    });

    return paper;
  }

  async getQuestionPapers(
    schoolId: string,
    examTermId?: string,
    classId?: string,
    subjectId?: string,
  ) {
    const where: any = { schoolId };
    if (examTermId) where.examTermId = examTermId;
    if (classId) where.classId = classId;
    if (subjectId) where.subjectId = subjectId;

    return this.prisma.examQuestionPaper.findMany({
      where,
      include: {
        subject: true,
        class: true,
        teacher: true,
        examTerm: true,
      },
      orderBy: [{ isActiveForExam: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async setActiveQuestionPaper(schoolId: string, questionPaperId: string) {
    const target = await this.prisma.examQuestionPaper.findFirst({
      where: { id: questionPaperId, schoolId },
    });
    if (!target) throw new NotFoundException('Question paper not found');

    // Deactivate all other papers for the same exam term, class, and subject
    await this.prisma.examQuestionPaper.updateMany({
      where: {
        schoolId,
        examTermId: target.examTermId,
        classId: target.classId,
        subjectId: target.subjectId,
      },
      data: { isActiveForExam: false },
    });

    // Activate the chosen paper
    const updated = await this.prisma.examQuestionPaper.update({
      where: { id: questionPaperId },
      data: { isActiveForExam: true, status: 'ACTIVE' },
      include: {
        subject: true,
        class: true,
        teacher: true,
        examTerm: true,
      },
    });

    return {
      success: true,
      message: `Version ${updated.version} (${updated.title}) is now set as the official active exam paper.`,
      paper: updated,
    };
  }

  async deleteQuestionPaper(schoolId: string, questionPaperId: string) {
    const paper = await this.prisma.examQuestionPaper.findFirst({
      where: { id: questionPaperId, schoolId },
    });
    if (!paper) throw new NotFoundException('Question paper not found');

    await this.prisma.examQuestionPaper.delete({
      where: { id: questionPaperId },
    });

    return { success: true, message: 'Question paper deleted successfully.' };
  }

  async getPrintableQuestionPaper(schoolId: string, questionPaperId: string) {
    const paper = await this.prisma.examQuestionPaper.findFirst({
      where: { id: questionPaperId, schoolId },
      include: {
        school: true,
        examTerm: true,
        class: true,
        subject: true,
        teacher: true,
      },
    });
    if (!paper) throw new NotFoundException('Question paper not found');

    // Parse structured questions JSON if present, or provide default structured format
    let parsedQuestions: any[] = [];
    if (paper.questionsJson) {
      try {
        parsedQuestions = JSON.parse(paper.questionsJson);
      } catch {
        parsedQuestions = [];
      }
    }

    if (parsedQuestions.length === 0) {
      parsedQuestions = [
        {
          sectionTitle: 'Section A — Multiple Choice Questions & Short Inquiries',
          instructions: 'Answer all questions in this section.',
          questions: [
            { qNumber: '1', questionText: 'Define the fundamental laws and principles governing this topic.', marks: 10 },
            { qNumber: '2', questionText: 'Explain the key terminology and distinguish between related concepts.', marks: 10 },
            { qNumber: '3', questionText: 'Solve the primary theoretical equations and present step-by-step reasoning.', marks: 10 },
          ],
        },
        {
          sectionTitle: 'Section B — Analytical & Problem Solving Questions',
          instructions: 'Answer any three questions from this section.',
          questions: [
            { qNumber: '4', questionText: 'Provide a comprehensive case analysis with supporting structural diagrams.', marks: 20 },
            { qNumber: '5', questionText: 'Derive the mathematical proof or experimental procedure in detail.', marks: 25 },
            { qNumber: '6', questionText: 'Critically evaluate modern practical applications and formulate conclusions.', marks: 25 },
          ],
        },
      ];
    }

    const durationText =
      paper.durationHours === 1
        ? '1 Hour'
        : paper.durationHours % 1 === 0
          ? `${paper.durationHours} Hours`
          : `${Math.floor(paper.durationHours)} Hours 30 Minutes`;

    return {
      paperId: paper.id,
      title: paper.title,
      version: paper.version,
      isActiveForExam: paper.isActiveForExam,
      status: paper.status,
      fileUrl: paper.fileUrl,
      school: {
        name: paper.school.name,
        code: paper.school.code,
        logoUrl: paper.school.logoUrl,
        address: paper.school.address,
        phone: paper.school.phone,
        email: paper.school.email,
      },
      examination: {
        examTermName: paper.examTerm.name,
        academicYear: paper.examTerm.academicYear,
        className: paper.class.name,
        subjectName: paper.subject.name,
        subjectCode: paper.subject.code || '',
        paperSetterTeacher: paper.teacher.fullName,
        duration: durationText,
        durationHours: paper.durationHours,
        totalMarks: paper.totalMarks,
      },
      instructions: paper.instructions,
      sections: parsedQuestions,
    };
  }
}
