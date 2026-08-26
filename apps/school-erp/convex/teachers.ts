import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./lib/hash";
import { buildEmail } from "./lib/identity";

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

// Provisions a teacher profile + a login user (auto email {name}T@{slug}.com).
export const createTeacher = mutation({
  args: {
    schoolId: v.id("schools"),
    firstName: v.string(),
    lastName: v.string(),
    employeeId: v.string(),
    phone: v.optional(v.string()),
    designation: v.string(),
    department: v.string(),
    joinDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    const slug = (school?.code ?? "school").toLowerCase();
    const fullName = `${args.firstName} ${args.lastName}`;

    // Unique login email within the school
    let counter = 0;
    let email = buildEmail(fullName, "teacher", slug, counter);
    while (
      await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).first()
    ) {
      counter++;
      email = buildEmail(fullName, "teacher", slug, counter);
    }

    const status = args.status ?? "active";

    const teacherId = await ctx.db.insert("teachers", {
      schoolId: args.schoolId,
      firstName: args.firstName,
      lastName: args.lastName,
      employeeId: args.employeeId,
      email,
      phone: args.phone,
      designation: args.designation,
      department: args.department,
      joinDate: args.joinDate,
      status,
    });

    const { hash, salt } = await hashPassword(args.password);
    await ctx.db.insert("users", {
      schoolId: args.schoolId,
      name: fullName,
      email,
      role: "teacher",
      passwordHash: hash,
      passwordSalt: salt,
      status,
      linkedTeacherId: teacherId,
      mustChangePassword: true,
      createdAt: Date.now(),
    });

    return { teacherId, email };
  },
});

// ─── Update Teacher Status (syncs the linked login) ───────────────────────────

export const updateTeacherStatus = mutation({
  args: {
    teacherId: v.id("teachers"),
    status: v.union(v.literal("active"), v.literal("inactive")),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.teacherId, { status: args.status });
    const teacher = await ctx.db.get(args.teacherId);
    if (teacher) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", teacher.email))
        .first();
      if (user && user.linkedTeacherId === args.teacherId) {
        await ctx.db.patch(user._id, { status: args.status });
      }
    }
    return await ctx.db.get(args.teacherId);
  },
});
