import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── List Teachers ────────────────────────────────────────────────────────────

export const listTeachers = query({
  args: {
    schoolId: v.id("schools"),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let teachers = await ctx.db
      .query("teachers")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    if (args.status) {
      teachers = teachers.filter((t) => t.status === args.status);
    }

    if (args.search) {
      const term = args.search.toLowerCase();
      teachers = teachers.filter(
        (t) =>
          t.firstName.toLowerCase().includes(term) ||
          t.lastName.toLowerCase().includes(term) ||
          t.employeeId.toLowerCase().includes(term) ||
          t.email.toLowerCase().includes(term) ||
          t.department.toLowerCase().includes(term)
      );
    }

    teachers.sort((a, b) => a.lastName.localeCompare(b.lastName));

    return teachers;
  },
});

// ─── Create Teacher ───────────────────────────────────────────────────────────

export const createTeacher = mutation({
  args: {
    schoolId: v.id("schools"),
    firstName: v.string(),
    lastName: v.string(),
    employeeId: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    designation: v.string(),
    department: v.string(),
    joinDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const { status, ...rest } = args;
    return await ctx.db.insert("teachers", {
      ...rest,
      status: status ?? "active",
    });
  },
});

// ─── Update Teacher Status ────────────────────────────────────────────────────

export const updateTeacherStatus = mutation({
  args: {
    teacherId: v.id("teachers"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.teacherId, { status: args.status });
    return await ctx.db.get(args.teacherId);
  },
});
