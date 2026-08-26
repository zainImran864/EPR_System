import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── List Students ────────────────────────────────────────────────────────────

export const listStudents = query({
  args: {
    schoolId: v.id("schools"),
    classId: v.optional(v.id("classes")),
    sectionId: v.optional(v.id("sections")),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("transferred"))
    ),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Use narrower index when classId is provided
    let students = args.classId
      ? await ctx.db
          .query("students")
          .withIndex("by_schoolId_and_classId", (q) =>
            q.eq("schoolId", args.schoolId).eq("classId", args.classId!)
          )
          .collect()
      : await ctx.db
          .query("students")
          .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
          .collect();

    // JS filters for optional narrowing
    if (args.sectionId) {
      students = students.filter((s) => s.sectionId === args.sectionId);
    }
    if (args.status) {
      students = students.filter((s) => s.status === args.status);
    }
    if (args.search) {
      const term = args.search.toLowerCase();
      students = students.filter(
        (s) =>
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(term) ||
          s.rollNumber.toLowerCase().includes(term) ||
          s.admissionNumber.toLowerCase().includes(term) ||
          s.guardianName.toLowerCase().includes(term)
      );
    }

    // Batch-load classes and sections to avoid N+1
    const classIds = [...new Set(students.map((s) => s.classId))];
    const sectionIds = [...new Set(students.map((s) => s.sectionId))];

    const [classRecords, sectionRecords] = await Promise.all([
      Promise.all(classIds.map((id) => ctx.db.get(id))),
      Promise.all(sectionIds.map((id) => ctx.db.get(id))),
    ]);

    const classMap = new Map(
      classRecords.filter(Boolean).map((c) => [c!._id, c!.name])
    );
    const sectionMap = new Map(
      sectionRecords.filter(Boolean).map((s) => [s!._id, s!.name])
    );

    const augmented = students.map((s) => ({
      ...s,
      className: classMap.get(s.classId) ?? "",
      sectionName: sectionMap.get(s.sectionId) ?? "",
    }));

    // Sort by rollNumber lexicographically
    augmented.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

    return augmented;
  },
});

// ─── Get Single Student ───────────────────────────────────────────────────────

export const getStudent = query({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    const [classRecord, sectionRecord] = await Promise.all([
      ctx.db.get(student.classId),
      ctx.db.get(student.sectionId),
    ]);

    return {
      ...student,
      className: classRecord?.name ?? "",
      sectionName: sectionRecord?.name ?? "",
    };
  },
});

// ─── Create Student ───────────────────────────────────────────────────────────

export const createStudent = mutation({
  args: {
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    firstName: v.string(),
    lastName: v.string(),
    admissionNumber: v.string(),
    rollNumber: v.string(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    guardianName: v.string(),
    guardianPhone: v.string(),
    guardianEmail: v.optional(v.string()),
    dob: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("transferred"))
    ),
    enrollmentDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { status, enrollmentDate, ...rest } = args;
    return await ctx.db.insert("students", {
      ...rest,
      status: status ?? "active",
      enrollmentDate: enrollmentDate ?? "",
    });
  },
});

// ─── Update Student Status ────────────────────────────────────────────────────

export const updateStudentStatus = mutation({
  args: {
    studentId: v.id("students"),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("transferred")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.studentId, { status: args.status });
    return await ctx.db.get(args.studentId);
  },
});

// ─── Update Student ───────────────────────────────────────────────────────────

export const updateStudent = mutation({
  args: {
    studentId: v.id("students"),
    classId: v.optional(v.id("classes")),
    sectionId: v.optional(v.id("sections")),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    admissionNumber: v.optional(v.string()),
    rollNumber: v.optional(v.string()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"), v.literal("other"))),
    guardianName: v.optional(v.string()),
    guardianPhone: v.optional(v.string()),
    guardianEmail: v.optional(v.string()),
    dob: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("transferred"))
    ),
    enrollmentDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { studentId, ...fields } = args;
    // Only patch fields that were actually provided
    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(studentId, patch);
    return await ctx.db.get(studentId);
  },
});
