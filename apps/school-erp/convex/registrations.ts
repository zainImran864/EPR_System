import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// ─── List registration requests (super-admin queue) ──────────────────────────

export const listRequests = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))
    ),
  },
  handler: async (ctx, args) => {
    if (args.status) {
      return await ctx.db
        .query("registrationRequests")
        .withIndex("by_status", (q) => q.eq("status", args.status!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("registrationRequests").order("desc").collect();
  },
});

// ─── Approve → create school + grade classes, activate admin user ─────────────

export const approveRequest = mutation({
  args: {
    requestId: v.id("registrationRequests"),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Registration request not found");
    if (req.status === "approved") return { alreadyApproved: true as const };

    const now = Date.now();

    // Create the tenant school
    const schoolId = await ctx.db.insert("schools", {
      name: req.schoolName,
      code: req.schoolSlug.toUpperCase(),
      primaryColor: "#0D9488",
      activeYear: "2026-2027",
      email: req.contactEmail,
      phone: req.phone,
      address: req.address,
      createdAt: now,
    });

    // Pre-create the grade classes the school offers
    for (const grade of req.classesOffered) {
      await ctx.db.insert("classes", {
        schoolId,
        name: `Grade ${grade}`,
        numericGrade: grade,
        academicYear: "2026-2027",
      });
    }

    // Activate the pending admin user and attach it to the school
    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", req.adminEmail))
      .first();
    if (adminUser) {
      await ctx.db.patch(adminUser._id, { schoolId, status: "active" });
    }

    await ctx.db.patch(args.requestId, {
      status: "approved",
      reviewNote: args.reviewNote,
    });

    await ctx.scheduler.runAfter(0, internal.email.sendApproved, {
      to: req.contactEmail,
      adminName: req.adminName,
      schoolName: req.schoolName,
      adminEmail: req.adminEmail,
    });

    return { schoolId };
  },
});

// ─── Reject → mark request + deactivate admin user ────────────────────────────

export const rejectRequest = mutation({
  args: {
    requestId: v.id("registrationRequests"),
    reviewNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Registration request not found");

    const adminUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", req.adminEmail))
      .first();
    if (adminUser) await ctx.db.patch(adminUser._id, { status: "inactive" });

    await ctx.db.patch(args.requestId, {
      status: "rejected",
      reviewNote: args.reviewNote,
    });

    await ctx.scheduler.runAfter(0, internal.email.sendDeclined, {
      to: req.contactEmail,
      adminName: req.adminName,
      schoolName: req.schoolName,
      reason: args.reviewNote,
    });

    return { ok: true };
  },
});

// ─── School change requests (name changes → super-admin approval) ─────────────

export const listSchoolChangeRequests = query({
  args: {
    status: v.optional(
      v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))
    ),
  },
  handler: async (ctx, args) => {
    const list = args.status
      ? await ctx.db
          .query("schoolChangeRequests")
          .withIndex("by_status", (q) => q.eq("status", args.status!))
          .order("desc")
          .collect()
      : await ctx.db.query("schoolChangeRequests").order("desc").collect();

    return await Promise.all(
      list.map(async (r) => {
        const school = await ctx.db.get(r.schoolId);
        return { ...r, schoolName: school?.name ?? "" };
      })
    );
  },
});

export const resolveSchoolChangeRequest = mutation({
  args: {
    requestId: v.id("schoolChangeRequests"),
    approve: v.boolean(),
  },
  handler: async (ctx, args) => {
    const req = await ctx.db.get(args.requestId);
    if (!req) throw new Error("Change request not found");
    if (req.status !== "pending") return { alreadyResolved: true as const };

    if (args.approve && req.field === "name") {
      await ctx.db.patch(req.schoolId, { name: req.requestedValue });
    }
    await ctx.db.patch(args.requestId, {
      status: args.approve ? "approved" : "rejected",
    });
    return { ok: true as const };
  },
});
