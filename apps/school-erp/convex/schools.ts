import { query, mutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";

// Full school doc (incl. SMTP secret) — internal only, for server-side email sends
export const getSchoolInternal = internalQuery({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.schoolId);
  },
});

// Get school details by code or default first school
export const getActiveSchool = query({
  args: { code: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.code) {
      const school = await ctx.db
        .query("schools")
        .withIndex("by_code", (q) => q.eq("code", args.code!))
        .first();
      if (school) return school;
    }
    // Return first school as active tenant
    const defaultSchool = await ctx.db.query("schools").first();
    return defaultSchool;
  },
});

// Get a single school by id (full document, minus the SMTP secret)
export const getSchool = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const school = await ctx.db.get(args.schoolId);
    if (!school) return null;
    const { smtpPass, ...safe } = school;
    // Never ship the SMTP password to the client; expose a "configured" flag.
    return { ...safe, smtpConfigured: Boolean(smtpPass) };
  },
});

// Update the per-school SMTP configuration (admin only in practice)
export const updateSmtp = mutation({
  args: {
    schoolId: v.id("schools"),
    smtpHost: v.optional(v.string()),
    smtpPort: v.optional(v.number()),
    smtpUser: v.optional(v.string()),
    smtpPass: v.optional(v.string()), // only patched when a new value is provided
    smtpFrom: v.optional(v.string()),
    smtpSecure: v.optional(v.boolean()),
    smtpEnabled: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { schoolId, smtpPass, ...fields } = args;
    const patch: Record<string, unknown> = { ...fields };
    if (smtpPass && smtpPass.length > 0) patch.smtpPass = smtpPass;
    await ctx.db.patch(schoolId, patch);
    return { ok: true };
  },
});

// List all registered schools/tenants
export const listSchools = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("schools").collect();
  },
});

// Update school settings and branding
export const updateBranding = mutation({
  args: {
    schoolId: v.id("schools"),
    name: v.optional(v.string()),
    primaryColor: v.optional(v.string()),
    logoUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    activeYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { schoolId, ...fields } = args;
    await ctx.db.patch(schoolId, fields);
    return await ctx.db.get(schoolId);
  },
});
