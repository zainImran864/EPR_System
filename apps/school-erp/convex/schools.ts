import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

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
