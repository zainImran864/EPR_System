import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { hashPassword } from "./lib/hash";
import { buildEmail } from "./lib/identity";

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

// Next auto admission number, e.g. "ADM-2026-001" (per school + year, max + 1).
async function nextAdmissionNumberFor(
  ctx: { db: any },
  schoolId: string,
  year: string
): Promise<string> {
  const students = await ctx.db
    .query("students")
    .withIndex("by_schoolId", (q: any) => q.eq("schoolId", schoolId))
    .collect();
  const prefix = `ADM-${year}-`;
  let max = 0;
  for (const s of students) {
    if ((s.admissionNumber ?? "").startsWith(prefix)) {
      const n = parseInt(s.admissionNumber.slice(prefix.length), 10);
      if (!Number.isNaN(n)) max = Math.max(max, n);
    }
  }
  return `${prefix}${String(max + 1).padStart(3, "0")}`;
}

function admissionYear(activeYear?: string): string {
  // "2026-2027" → "2026"; fallback keeps only digits
  return (activeYear ?? "").split("-")[0] || "0000";
}

// Preview query for the (read-only) auto admission number in the add form.
export const nextAdmissionNumber = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    return nextAdmissionNumberFor(ctx, args.schoolId, admissionYear(school?.activeYear));
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
    rollNumber: v.string(),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    guardianName: v.string(),
    guardianPhone: v.string(),
    guardianEmail: v.optional(v.string()),
    studentContactEmail: v.optional(v.string()),
    dob: v.optional(v.string()),
    bloodGroup: v.optional(v.string()),
    address: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal("active"), v.literal("inactive"), v.literal("transferred"))
    ),
    enrollmentDate: v.optional(v.string()),
    // Single admin-set login password, shared by the student + parent accounts.
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      status,
      enrollmentDate,
      password,
      studentContactEmail,
      ...rest
    } = args;

    const school = await ctx.db.get(args.schoolId);
    const slug = (school?.code ?? "school").toLowerCase();
    const fullName = `${args.firstName} ${args.lastName}`;
    const finalStatus = status ?? "active";
    const userStatus = finalStatus === "transferred" ? "inactive" : finalStatus;

    // Auto, server-authoritative admission number
    const admissionNumber = await nextAdmissionNumberFor(
      ctx,
      args.schoolId,
      admissionYear(school?.activeYear)
    );

    // Unique email helper within the tenant
    const uniqueEmail = async (role: "student" | "parent") => {
      let counter = 0;
      let email = buildEmail(fullName, role, slug, counter);
      while (
        await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).first()
      ) {
        counter++;
        email = buildEmail(fullName, role, slug, counter);
      }
      return email;
    };

    const studentEmail = await uniqueEmail("student");
    const parentEmail = await uniqueEmail("parent");

    // Create the student profile first
    const studentId = await ctx.db.insert("students", {
      ...rest,
      admissionNumber,
      status: finalStatus,
      enrollmentDate: enrollmentDate ?? "",
    });

    // One password for both accounts (admin-set)
    const pass = password || "welcome123";
    const { hash, salt } = await hashPassword(pass);

    // Student login
    await ctx.db.insert("users", {
      schoolId: args.schoolId,
      name: fullName,
      email: studentEmail,
      role: "student",
      passwordHash: hash,
      passwordSalt: salt,
      status: userStatus,
      linkedStudentId: studentId,
      mustChangePassword: true,
      createdAt: Date.now(),
    });

    // Parent login (linked to this student)
    const parentUserId = await ctx.db.insert("users", {
      schoolId: args.schoolId,
      name: args.guardianName,
      email: parentEmail,
      role: "parent",
      passwordHash: hash,
      passwordSalt: salt,
      status: userStatus,
      mustChangePassword: true,
      createdAt: Date.now(),
    });
    await ctx.db.patch(studentId, { linkedParentUserId: parentUserId });

    const smtp = school ? smtpFromSchool(school) : undefined;
    const schoolName = school?.name ?? "Your School";
    const logoUrl = school?.logoUrl ?? null;

    // Student credentials → student's own inbox (if provided)
    if (studentContactEmail) {
      await ctx.scheduler.runAfter(0, internal.email.sendStudentCredentials, {
        to: studentContactEmail,
        studentName: fullName,
        loginEmail: studentEmail,
        password: pass,
        schoolName,
        schoolLogoUrl: logoUrl,
        smtp,
      });
    }

    // Parent credentials → guardian's inbox (if provided)
    if (args.guardianEmail) {
      await ctx.scheduler.runAfter(0, internal.email.sendParentCredentials, {
        to: args.guardianEmail,
        parentName: args.guardianName,
        studentName: fullName,
        loginEmail: parentEmail,
        password: pass,
        schoolName,
        schoolLogoUrl: logoUrl,
        smtp,
      });
    }

    return { studentId, studentEmail, parentEmail, admissionNumber };
  },
});

// ─── Delete Student (removes the profile + student & parent logins) ───────────

export const deleteStudent = mutation({
  args: { studentId: v.id("students") },
  handler: async (ctx, args) => {
    const student = await ctx.db.get(args.studentId);
    if (!student) return { ok: true };

    const wipeLogin = async (userId: any) => {
      const sessions = await ctx.db
        .query("sessions")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      for (const s of sessions) await ctx.db.delete(s._id);
      const devices = await ctx.db
        .query("trustedDevices")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();
      for (const d of devices) await ctx.db.delete(d._id);
      await ctx.db.delete(userId);
    };

    // Student login (role student, linkedStudentId)
    const studentUsers = await ctx.db
      .query("users")
      .withIndex("by_schoolId_and_role", (q) =>
        q.eq("schoolId", student.schoolId).eq("role", "student")
      )
      .collect();
    const studentUser = studentUsers.find((u) => u.linkedStudentId === args.studentId);
    if (studentUser) await wipeLogin(studentUser._id);

    // Parent login (linkedParentUserId)
    if (student.linkedParentUserId) await wipeLogin(student.linkedParentUserId);

    await ctx.db.delete(args.studentId);
    return { ok: true };
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

    // Keep the linked student login's display name in sync with the profile.
    if (fields.firstName !== undefined || fields.lastName !== undefined) {
      const student = await ctx.db.get(studentId);
      if (student) {
        const fullName = `${student.firstName} ${student.lastName}`;
        const studentUser = await ctx.db
          .query("users")
          .withIndex("by_schoolId_and_role", (q) =>
            q.eq("schoolId", student.schoolId).eq("role", "student")
          )
          .collect();
        const linked = studentUser.find((u) => u.linkedStudentId === studentId);
        if (linked) await ctx.db.patch(linked._id, { name: fullName });
      }
    }
    return await ctx.db.get(studentId);
  },
});
