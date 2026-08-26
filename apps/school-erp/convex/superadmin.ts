import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword } from "./lib/hash";

// ─── Bootstrap the platform super-admin (run once) ────────────────────────────
// Convex dashboard → Functions → superadmin:seedSuperAdmin
//   { email: "root@platform.admin", password: "change-me" }

export const seedSuperAdmin = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (existing) return { alreadyExists: true as const, userId: existing._id };

    const { hash, salt } = await hashPassword(args.password);
    const userId = await ctx.db.insert("users", {
      name: args.name ?? "Platform Super Admin",
      email: args.email,
      role: "superadmin",
      passwordHash: hash,
      passwordSalt: salt,
      status: "active",
      createdAt: Date.now(),
    });
    return { alreadyExists: false as const, userId };
  },
});

// ─── One-click default super-admin seed (run once) ───────────────────────────
// Convex dashboard → Functions → superadmin:seedDefaultSuperAdmin  (no args)
// or CLI: npx convex run superadmin:seedDefaultSuperAdmin
// Credentials: adminnn / admin321@erp.com / Test-123
export const seedDefaultSuperAdmin = mutation({
  args: {},
  handler: async (ctx): Promise<{ alreadyExists: boolean; email: string }> => {
    const email = "admin321@erp.com";
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();
    if (existing) return { alreadyExists: true, email };

    const { hash, salt } = await hashPassword("Test-123");
    await ctx.db.insert("users", {
      name: "adminnn",
      email,
      role: "superadmin",
      passwordHash: hash,
      passwordSalt: salt,
      status: "active",
      createdAt: Date.now(),
    });
    return { alreadyExists: false, email };
  },
});

// ─── Platform-wide stats for the super-admin dashboard ────────────────────────

export const platformStats = query({
  args: {},
  handler: async (ctx) => {
    const [schools, pending, allRequests, users] = await Promise.all([
      ctx.db.query("schools").collect(),
      ctx.db
        .query("registrationRequests")
        .withIndex("by_status", (q) => q.eq("status", "pending"))
        .collect(),
      ctx.db.query("registrationRequests").collect(),
      ctx.db.query("users").collect(),
    ]);

    return {
      schoolCount: schools.length,
      pendingCount: pending.length,
      approvedCount: allRequests.filter((r) => r.status === "approved").length,
      rejectedCount: allRequests.filter((r) => r.status === "rejected").length,
      userCount: users.length,
    };
  },
});
