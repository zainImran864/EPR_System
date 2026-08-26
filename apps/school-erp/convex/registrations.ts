import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
    return { ok: true };
  },
});
