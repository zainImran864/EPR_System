import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { hashPassword, verifyPassword, generateToken } from "./lib/hash";
import { verifyTotp } from "./lib/totp";
import { slugify, buildEmail } from "./lib/identity";

const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── Register a school (creates a pending request + pending admin user) ────────

export const register = mutation({
  args: {
    schoolName: v.string(),
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    contactEmail: v.string(),
    classesOffered: v.array(v.number()),
    totalTeachers: v.optional(v.number()),
    totalStudents: v.optional(v.number()),
    adminName: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Ensure a unique school slug across existing schools + pending requests
    const baseSlug = slugify(args.schoolName) || "school";
    const existingRequests = await ctx.db.query("registrationRequests").collect();
    const usedSlugs = new Set(existingRequests.map((r) => r.schoolSlug));
    let slug = baseSlug;
    let n = 1;
    const schoolWithCode = async (code: string) =>
      ctx.db.query("schools").withIndex("by_code", (q) => q.eq("code", code.toUpperCase())).first();
    while (usedSlugs.has(slug) || (await schoolWithCode(slug))) {
      slug = `${baseSlug}${n++}`;
    }

    // Generate a unique admin email within this slug
    let counter = 0;
    let adminEmail = buildEmail(args.adminName, "admin", slug, counter);
    while (
      await ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", adminEmail)).first()
    ) {
      counter++;
      adminEmail = buildEmail(args.adminName, "admin", slug, counter);
    }

    const { hash, salt } = await hashPassword(args.password);
    const now = Date.now();

    const requestId = await ctx.db.insert("registrationRequests", {
      schoolName: args.schoolName,
      schoolSlug: slug,
      address: args.address,
      phone: args.phone,
      contactEmail: args.contactEmail,
      classesOffered: args.classesOffered,
      totalTeachers: args.totalTeachers,
      totalStudents: args.totalStudents,
      adminName: args.adminName,
      adminEmail,
      adminPasswordHash: hash,
      adminPasswordSalt: salt,
      status: "pending",
      createdAt: now,
    });

    // Create the admin user in "pending" so they can log in and see the review screen.
    await ctx.db.insert("users", {
      name: args.adminName,
      email: adminEmail,
      role: "admin",
      passwordHash: hash,
      passwordSalt: salt,
      status: "pending",
      createdAt: now,
    });

    // Send the "registration received / under review" email.
    await ctx.scheduler.runAfter(0, internal.email.sendRegistrationPending, {
      to: args.contactEmail,
      adminName: args.adminName,
      schoolName: args.schoolName,
      adminEmail,
      classes: args.classesOffered,
      address: args.address,
    });

    return { requestId, adminEmail, schoolSlug: slug };
  },
});

// ─── Login ─────────────────────────────────────────────────────────────────

export const login = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    deviceToken: v.optional(v.string()), // remembered-device token from this browser
  },
  handler: async (ctx, args) => {
    const email = args.email.trim();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    if (!user) return { ok: false as const, error: "invalid" as const };

    const valid = await verifyPassword(args.password, user.passwordHash, user.passwordSalt);
    if (!valid) return { ok: false as const, error: "invalid" as const };

    if (user.status === "pending")
      return { ok: false as const, status: "pending" as const, role: user.role };
    if (user.status === "inactive")
      return { ok: false as const, status: "inactive" as const };

    const now = Date.now();

    // 2FA gate: if enabled and this browser isn't a trusted device, challenge.
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      let trusted = false;
      if (args.deviceToken) {
        const device = await ctx.db
          .query("trustedDevices")
          .withIndex("by_deviceToken", (q) => q.eq("deviceToken", args.deviceToken!))
          .first();
        if (device && device.userId === user._id) {
          trusted = true;
          await ctx.db.patch(device._id, { lastUsedAt: now });
        }
      }
      if (!trusted) {
        // Issue a pending session that verifyLoginTwoFactor will activate.
        const pendingToken = generateToken();
        await ctx.db.insert("sessions", {
          userId: user._id,
          token: pendingToken,
          createdAt: now,
          expiresAt: now + 10 * 60 * 1000, // 10 min to complete 2FA
          pending2fa: true,
        });
        return { ok: false as const, status: "2fa" as const, token: pendingToken };
      }
    }

    const token = generateToken();
    await ctx.db.insert("sessions", {
      userId: user._id,
      token,
      createdAt: now,
      expiresAt: now + SESSION_TTL_MS,
    });

    return { ok: true as const, token, role: user.role, userId: user._id };
  },
});

// ─── Complete a 2FA login challenge ──────────────────────────────────────────

export const verifyLoginTwoFactor = mutation({
  args: {
    token: v.string(), // the pending session token from login()
    code: v.string(),
    rememberDevice: v.optional(v.boolean()),
    deviceLabel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session || session.expiresAt < Date.now())
      return { ok: false as const, error: "expired" as const };

    const user = await ctx.db.get(session.userId);
    if (!user || !user.twoFactorSecret)
      return { ok: false as const, error: "invalid" as const };

    const valid = await verifyTotp(user.twoFactorSecret, args.code);
    if (!valid) return { ok: false as const, error: "bad-code" as const };

    const now = Date.now();
    // Promote the pending session into a full session.
    await ctx.db.patch(session._id, {
      pending2fa: undefined,
      expiresAt: now + SESSION_TTL_MS,
    });

    let deviceToken: string | undefined;
    if (args.rememberDevice) {
      deviceToken = generateToken();
      await ctx.db.insert("trustedDevices", {
        userId: user._id,
        deviceToken,
        label: args.deviceLabel || "Unknown device",
        createdAt: now,
        lastUsedAt: now,
      });
    }

    return {
      ok: true as const,
      token: args.token,
      role: user.role,
      userId: user._id,
      deviceToken,
    };
  },
});

// ─── Logout ────────────────────────────────────────────────────────────────

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (session) await ctx.db.delete(session._id);
    return { ok: true };
  },
});

// ─── Current user (resolve session → sanitized user + school) ──────────────────

export const currentUser = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.token) return null;
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token!))
      .first();
    if (!session || session.expiresAt < Date.now()) return null;
    // A session still awaiting its 2FA code is not yet usable.
    if (session.pending2fa) return null;

    const user = await ctx.db.get(session.userId);
    if (!user) return null;

    const school = user.schoolId ? await ctx.db.get(user.schoolId) : null;

    // Resolve the linked student (for student self-view, or parent's child).
    let student = null;
    if (user.role === "student" && user.linkedStudentId) {
      student = await ctx.db.get(user.linkedStudentId);
    } else if (user.role === "parent") {
      student = (
        await ctx.db
          .query("students")
          .withIndex("by_schoolId", (q) => q.eq("schoolId", user.schoolId!))
          .collect()
      ).find((s) => s.linkedParentUserId === user._id) ?? null;
    }
    let studentContext = null;
    if (student) {
      const cls = await ctx.db.get(student.classId);
      const sec = await ctx.db.get(student.sectionId);
      studentContext = {
        studentId: student._id,
        classId: student.classId,
        sectionId: student.sectionId,
        className: cls?.name ?? "",
        sectionName: sec?.name ?? "",
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        admissionNumber: student.admissionNumber,
      };
    }

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      schoolId: user.schoolId ?? null,
      avatarUrl: user.avatarUrl ?? null,
      phone: user.phone ?? null,
      linkedTeacherId: user.linkedTeacherId ?? null,
      linkedStudentId: user.linkedStudentId ?? null,
      mustChangePassword: user.mustChangePassword ?? false,
      twoFactorEnabled: user.twoFactorEnabled ?? false,
      notificationsEnabled: user.notificationsEnabled ?? true,
      themeColor: user.themeColor ?? null,
      studentContext,
      school: school
        ? {
            _id: school._id,
            name: school.name,
            code: school.code,
            primaryColor: school.primaryColor ?? null,
            logoUrl: school.logoUrl ?? null,
            activeYear: school.activeYear,
          }
        : null,
    };
  },
});
