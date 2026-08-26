import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

function overallGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  if (pct >= 40) return "E";
  return "F";
}

export const listExams = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const exams = await ctx.db
      .query("exams")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .collect();
    exams.sort((a, b) => b.startDate.localeCompare(a.startDate));
    return exams;
  },
});

/** Aggregate a student's marks per exam into a subject-wise result set. */
export const getStudentResults = query({
  args: { schoolId: v.id("schools"), studentId: v.id("students") },
  handler: async (ctx, args) => {
    const marks = await ctx.db
      .query("marks")
      .withIndex("by_school_exam_student", (q) => q.eq("schoolId", args.schoolId))
      .collect();
    const studentMarks = marks.filter((m) => m.studentId === args.studentId);

    // Resolve subject names once
    const subjectIds = Array.from(new Set(studentMarks.map((m) => m.subjectId)));
    const subjectNames = new Map<string, string>();
    for (const sid of subjectIds) {
      const s = await ctx.db.get(sid as Id<"subjects">);
      subjectNames.set(sid, s?.name ?? "Subject");
    }

    // Group by exam
    const byExam = new Map<string, typeof studentMarks>();
    for (const m of studentMarks) {
      const arr = byExam.get(m.examId) ?? [];
      arr.push(m);
      byExam.set(m.examId, arr);
    }

    const results = [];
    for (const [examId, rows] of byExam) {
      const exam = await ctx.db.get(examId as Id<"exams">);
      const total = rows.reduce((s, r) => s + r.totalMarks, 0);
      const obtained = rows.reduce((s, r) => s + r.obtainedMarks, 0);
      const pct = total > 0 ? (obtained / total) * 100 : 0;
      results.push({
        examId,
        examName: exam?.name ?? "Exam",
        term: exam?.term ?? "",
        isPublished: exam?.isPublished ?? false,
        subjects: rows.map((r) => ({
          subjectName: subjectNames.get(r.subjectId) ?? "Subject",
          totalMarks: r.totalMarks,
          obtainedMarks: r.obtainedMarks,
          grade: r.grade,
        })),
        totalMarks: total,
        obtainedMarks: obtained,
        percentage: Math.round(pct * 10) / 10,
        overallGrade: overallGrade(pct),
      });
    }
    results.sort((a, b) => a.examName.localeCompare(b.examName));
    return results;
  },
});

/** Full report-card payload for one student + exam (used by the printable view). */
export const getReportCard = query({
  args: {
    schoolId: v.id("schools"),
    studentId: v.id("students"),
    examId: v.id("exams"),
  },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;
    const school = await ctx.db.get(args.schoolId);
    const exam = await ctx.db.get(args.examId);
    const cls = await ctx.db.get(student.classId);
    const sec = await ctx.db.get(student.sectionId);

    const marks = (
      await ctx.db
        .query("marks")
        .withIndex("by_school_exam_student", (q) =>
          q.eq("schoolId", args.schoolId).eq("examId", args.examId)
        )
        .collect()
    ).filter((m) => m.studentId === args.studentId);

    const subjects = [];
    for (const m of marks) {
      const subj = await ctx.db.get(m.subjectId);
      subjects.push({
        subjectName: subj?.name ?? "Subject",
        totalMarks: m.totalMarks,
        obtainedMarks: m.obtainedMarks,
        grade: m.grade,
        remarks: m.remarks ?? "",
      });
    }

    const total = subjects.reduce((s, r) => s + r.totalMarks, 0);
    const obtained = subjects.reduce((s, r) => s + r.obtainedMarks, 0);
    const pct = total > 0 ? (obtained / total) * 100 : 0;

    return {
      school: school
        ? { name: school.name, code: school.code, logoUrl: school.logoUrl ?? null, address: school.address ?? "", activeYear: school.activeYear }
        : null,
      student: {
        name: `${student.firstName} ${student.lastName}`,
        admissionNumber: student.admissionNumber,
        rollNumber: student.rollNumber,
        className: cls?.name ?? "",
        sectionName: sec?.name ?? "",
      },
      exam: exam ? { name: exam.name, term: exam.term } : null,
      subjects,
      totalMarks: total,
      obtainedMarks: obtained,
      percentage: Math.round(pct * 10) / 10,
      overallGrade: overallGrade(pct),
    };
  },
});
