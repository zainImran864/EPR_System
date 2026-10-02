import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
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

// Extract a school's SMTP config into the shape the email actions expect.
function smtpFromSchool(school: {
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  smtpSecure?: boolean;
  smtpEnabled?: boolean;
}) {
  return {
    host: school.smtpHost,
    port: school.smtpPort,
    user: school.smtpUser,
    pass: school.smtpPass,
    from: school.smtpFrom,
    secure: school.smtpSecure,
    enabled: school.smtpEnabled,
  };
}

// Next auto employee id, e.g. "EMP-001" (max existing + 1).
async function nextEmployeeIdFor(
  ctx: { db: any },
  schoolId: string
): Promise<string> {
  const teachers = await ctx.db
    .query("teachers")
    .withIndex("by_schoolId", (q: any) => q.eq("schoolId", schoolId))
    .collect();
  let max = 0;
  for (const t of teachers) {
    const m = /EMP-(\d+)/i.exec(t.employeeId ?? "");
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `EMP-${String(max + 1).padStart(3, "0")}`;
}

// Preview query for the (read-only) auto employee id in the add form.
export const nextEmployeeId = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => nextEmployeeIdFor(ctx, args.schoolId),
});

// ─── Create Teacher ───────────────────────────────────────────────────────────

// Provisions a teacher profile + a login user (auto email {name}T@{slug}.com).
export const createTeacher = mutation({
  args: {
    schoolId: v.id("schools"),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    designation: v.string(),
    department: v.string(),
    joinDate: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    password: v.string(),
    personalEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    const slug = (school?.code ?? "school").toLowerCase();
    const fullName = `${args.firstName} ${args.lastName}`;

    // Auto, server-authoritative employee id
    const employeeId = await nextEmployeeIdFor(ctx, args.schoolId);

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
      employeeId,
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

    // Email the login to the teacher's real inbox, via the school's SMTP.
    if (args.personalEmail) {
      await ctx.scheduler.runAfter(0, internal.email.sendTeacherCredentials, {
        to: args.personalEmail,
        teacherName: fullName,
        loginEmail: email,
        password: args.password,
        schoolName: school?.name ?? "Your School",
        schoolLogoUrl: school?.logoUrl ?? null,
        smtp: school ? smtpFromSchool(school) : undefined,
      });
    }

    return { teacherId, email, employeeId };
  },
});

// ─── Update Teacher (admin edit; syncs the linked login name/status) ──────────

export const updateTeacher = mutation({
  args: {
    teacherId: v.id("teachers"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    designation: v.optional(v.string()),
    department: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
  },
  handler: async (ctx, args) => {
    const { teacherId, ...fields } = args;
    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(teacherId, patch);

    const teacher = await ctx.db.get(teacherId);
    if (teacher) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", teacher.email))
        .first();
      if (user && user.linkedTeacherId === teacherId) {
        const userPatch: Record<string, unknown> = {};
        if (fields.firstName !== undefined || fields.lastName !== undefined)
          userPatch.name = `${teacher.firstName} ${teacher.lastName}`;
        if (fields.phone !== undefined) userPatch.phone = teacher.phone;
        if (fields.status !== undefined) userPatch.status = teacher.status;
        if (Object.keys(userPatch).length) await ctx.db.patch(user._id, userPatch);
      }
    }
    return await ctx.db.get(teacherId);
  },
});

// ─── Delete Teacher (removes the profile + its login) ─────────────────────────

export const deleteTeacher = mutation({
  args: { teacherId: v.id("teachers") },
  handler: async (ctx, args) => {
    const teacher = await ctx.db.get(args.teacherId);
    if (!teacher) return { ok: true };

    // Remove the linked login so they can no longer access the dashboard.
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", teacher.email))
      .first();
    if (user && user.linkedTeacherId === args.teacherId) {
      // Drop any active sessions + trusted devices for this login.
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const s of sessions) await ctx.db.delete(s._id);
      const devices = await ctx.db
        .query("trustedDevices")
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .collect();
      for (const d of devices) await ctx.db.delete(d._id);
      await ctx.db.delete(user._id);
    }

    await ctx.db.delete(args.teacherId);
    return { ok: true };
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
