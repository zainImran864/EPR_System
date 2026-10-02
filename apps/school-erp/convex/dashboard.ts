import { query } from "./_generated/server";
import { v } from "convex/values";

// ─── Dashboard Statistics ─────────────────────────────────────────────────────

export const getStats = query({
  args: {
    schoolId: v.id("schools"),
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Collect all base data in parallel
    const [students, teachers, classes, sections, allMarks] = await Promise.all([
      ctx.db
        .query("students")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
        .collect(),
      ctx.db
        .query("teachers")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
        .collect(),
      ctx.db
        .query("classes")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
        .collect(),
      ctx.db
        .query("sections")
        .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
        .collect(),
      ctx.db
        .query("marks")
        .filter((q) => q.eq(q.field("schoolId"), args.schoolId))
        .collect(),
    ]);

    const activeStudents = students.filter((s) => s.status === "active");
    const activeTeachers = teachers.filter((t) => t.status === "active");

    // Gender breakdown among active students
    const genderBreakdown = { male: 0, female: 0, other: 0 };
    for (const s of activeStudents) {
      genderBreakdown[s.gender]++;
    }

    // Average exam score across all marks
    let avgExamScore: number | null = null;
    if (allMarks.length > 0) {
      const totalPct = allMarks.reduce(
        (sum, m) => sum + (m.totalMarks > 0 ? (m.obtainedMarks / m.totalMarks) * 100 : 0),
        0
      );
      avgExamScore = Math.round((totalPct / allMarks.length) * 10) / 10;
    }

    // Grade distribution across all marks
    const gradeDistribution: Record<string, number> = {};
    for (const m of allMarks) {
      gradeDistribution[m.grade] = (gradeDistribution[m.grade] ?? 0) + 1;
    }

    // Today's attendance (or provided date)
    let todayAttendanceRate: number | null = null;
    let attendanceByStatus: { present: number; absent: number; late: number; excused: number } = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };

    if (args.date) {
      const todayRows = await ctx.db
        .query("attendance")
        .withIndex("by_schoolId_and_date", (q) =>
          q.eq("schoolId", args.schoolId).eq("date", args.date!)
        )
        .collect();

      if (todayRows.length > 0) {
        for (const row of todayRows) {
          attendanceByStatus[row.status]++;
        }
        todayAttendanceRate = Math.round(
          ((attendanceByStatus.present + attendanceByStatus.late) / todayRows.length) * 100
        );
      }
    }

    // Recent admissions — last 5 by enrollmentDate desc
    const sortedStudents = [...students].sort((a, b) =>
      b.enrollmentDate.localeCompare(a.enrollmentDate)
    );
    const recentRaw = sortedStudents.slice(0, 5);

    // Batch-load class/section names for recent admissions
    const recentClassIds = [...new Set(recentRaw.map((s) => s.classId))];
    const recentSectionIds = [...new Set(recentRaw.map((s) => s.sectionId))];

    const [recentClasses, recentSections] = await Promise.all([
      Promise.all(recentClassIds.map((id) => ctx.db.get(id))),
      Promise.all(recentSectionIds.map((id) => ctx.db.get(id))),
    ]);

    const classMap = new Map(
      recentClasses.filter(Boolean).map((c) => [c!._id, c!.name])
    );
    const sectionMap = new Map(
      recentSections.filter(Boolean).map((s) => [s!._id, s!.name])
    );

    const recentAdmissions = recentRaw.map((s) => ({
      ...s,
      className: classMap.get(s.classId) ?? "",
      sectionName: sectionMap.get(s.sectionId) ?? "",
    }));

    return {
      studentCount: activeStudents.length,
      teacherCount: activeTeachers.length,
      classCount: classes.length,
      sectionCount: sections.length,
      todayAttendanceRate,
      avgExamScore,
      recentAdmissions,
      genderBreakdown,
      attendanceByStatus,
      gradeDistribution,
    };
  },
});
