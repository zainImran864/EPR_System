import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── List Exams ───────────────────────────────────────────────────────────────

export const listExams = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const exams = await ctx.db
      .query("exams")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Sort by startDate descending
    exams.sort((a, b) => b.startDate.localeCompare(a.startDate));

    return exams;
  },
});

// ─── Create Exam ──────────────────────────────────────────────────────────────

export const createExam = mutation({
  args: {
    schoolId: v.id("schools"),
    name: v.string(),
    term: v.string(),
    startDate: v.string(),
    endDate: v.string(),
    academicYear: v.string(),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { isPublished, ...rest } = args;
    return await ctx.db.insert("exams", {
      ...rest,
      isPublished: isPublished ?? false,
    });
  },
});

// ─── Marks Matrix for a Section ───────────────────────────────────────────────

export const getMarksMatrix = query({
  args: {
    schoolId: v.id("schools"),
    examId: v.id("exams"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    subjectId: v.optional(v.id("subjects")),
  },
  handler: async (ctx, args) => {
    // Active students in this section
    const students = await ctx.db
      .query("students")
      .withIndex("by_schoolId_and_sectionId", (q) =>
        q.eq("schoolId", args.schoolId).eq("sectionId", args.sectionId)
      )
      .collect()
      .then((rows) => rows.filter((s) => s.status === "active"));

    // All marks for this exam + section
    let marks = await ctx.db
      .query("marks")
      .withIndex("by_school_exam_section", (q) =>
        q
          .eq("schoolId", args.schoolId)
          .eq("examId", args.examId)
          .eq("classId", args.classId)
          .eq("sectionId", args.sectionId)
      )
      .collect();

    if (args.subjectId) {
      marks = marks.filter((m) => m.subjectId === args.subjectId);
    }

    // Build a lookup: studentId + subjectId → mark
    const marksMap = new Map(
      marks.map((m) => [`${m.studentId}:${m.subjectId}`, m])
    );

    const matrix = students.map((s) => {
      const key = `${s._id}:${args.subjectId ?? ""}`;
      const mark = args.subjectId ? marksMap.get(key) : undefined;
      return {
        studentId: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        rollNumber: s.rollNumber,
        subjectId: args.subjectId ?? null,
        obtainedMarks: mark?.obtainedMarks ?? null,
        totalMarks: mark?.totalMarks ?? 100,
        grade: mark?.grade ?? "",
      };
    });

    matrix.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

    return matrix;
  },
});

// ─── Save Marks (Upsert) ──────────────────────────────────────────────────────

export const saveMarks = mutation({
  args: {
    schoolId: v.id("schools"),
    examId: v.id("exams"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    subjectId: v.id("subjects"),
    entries: v.array(
      v.object({
        studentId: v.id("students"),
        obtainedMarks: v.number(),
        totalMarks: v.number(),
        grade: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    let saved = 0;

    for (const entry of args.entries) {
      // Find existing mark for this student + exam, then filter to subject
      const existingRows = await ctx.db
        .query("marks")
        .withIndex("by_school_exam_student", (q) =>
          q
            .eq("schoolId", args.schoolId)
            .eq("examId", args.examId)
            .eq("studentId", entry.studentId)
        )
        .collect();

      const existing = existingRows.find((m) => m.subjectId === args.subjectId);

      if (existing) {
        await ctx.db.patch(existing._id, {
          obtainedMarks: entry.obtainedMarks,
          totalMarks: entry.totalMarks,
          grade: entry.grade,
        });
      } else {
        await ctx.db.insert("marks", {
          schoolId: args.schoolId,
          examId: args.examId,
          studentId: entry.studentId,
          classId: args.classId,
          sectionId: args.sectionId,
          subjectId: args.subjectId,
          obtainedMarks: entry.obtainedMarks,
          totalMarks: entry.totalMarks,
          grade: entry.grade,
        });
      }

      saved++;
    }

    return { saved };
  },
});

// ─── List Subjects ────────────────────────────────────────────────────────────

export const listSubjects = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const subjects = await ctx.db
      .query("subjects")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    subjects.sort((a, b) => a.name.localeCompare(b.name));

    return subjects;
  },
});
