import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword, verifyPassword, generateToken } from "./lib/hash";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/** Resolve a live session token to its user, or throw. */
async function requireUser(ctx: MutationCtx, token: string) {
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .first();
  if (!session || session.expiresAt < Date.now()) throw new Error("Not authenticated");
  const user = await ctx.db.get(session.userId);
  if (!user) throw new Error("User not found");
  return user;
}

// ─── Profile (name, phone) ────────────────────────────────────────────────────
export const updateProfile = mutation({
  args: { token: v.string(), name: v.optional(v.string()), phone: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const patch: Record<string, unknown> = {};
    if (args.name && args.name.trim()) patch.name = args.name.trim();
    if (args.phone !== undefined) patch.phone = args.phone;
    await ctx.db.patch(user._id, patch);
    return { ok: true };
  },
});

// ─── Change password (verify current) ─────────────────────────────────────────
export const changePassword = mutation({
  args: { token: v.string(), currentPassword: v.string(), newPassword: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const valid = await verifyPassword(
      args.currentPassword,
      user.passwordHash,
      user.passwordSalt
    );
    if (!valid) return { ok: false as const, error: "wrong-password" as const };
    if (args.newPassword.length < 6)
      return { ok: false as const, error: "too-short" as const };

    const { hash, salt } = await hashPassword(args.newPassword);
    await ctx.db.patch(user._id, {
      passwordHash: hash,
      passwordSalt: salt,
      mustChangePassword: false,
    });
    return { ok: true as const };
  },
});

// ─── Two-factor toggle (stores enabled flag + a secret) ───────────────────────
export const setTwoFactor = mutation({
  args: { token: v.string(), enabled: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    await ctx.db.patch(user._id, {
      twoFactorEnabled: args.enabled,
      twoFactorSecret: args.enabled ? generateToken() : undefined,
    });
    return { ok: true };
  },
});

// ─── Notification preference toggle ───────────────────────────────────────────
export const setNotifications = mutation({
  args: { token: v.string(), enabled: v.boolean() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    await ctx.db.patch(user._id, { notificationsEnabled: args.enabled });
    return { ok: true };
  },
});

// ─── Avatar upload (Convex file storage) ──────────────────────────────────────
export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx, args.token);
    return await ctx.storage.generateUploadUrl();
  },
});

export const setAvatar = mutation({
  args: { token: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const url = await ctx.storage.getUrl(args.storageId);
    if (url) await ctx.db.patch(user._id, { avatarUrl: url });
    return { ok: true, url };
  },
});

// ─── School logo upload (admin — direct, no approval) ─────────────────────────
export const setSchoolLogo = mutation({
  args: { token: v.string(), storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    if (user.role !== "admin" || !user.schoolId)
      throw new Error("Only a school admin can set the logo");
    const url = await ctx.storage.getUrl(args.storageId);
    if (url) await ctx.db.patch(user.schoolId, { logoUrl: url });
    return { ok: true, url };
  },
});

// ─── School name change request (admin → super-admin approval) ────────────────
export const requestSchoolNameChange = mutation({
  args: { token: v.string(), requestedValue: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    if (user.role !== "admin" || !user.schoolId)
      throw new Error("Only a school admin can request a name change");
    const school = await ctx.db.get(user.schoolId as Id<"schools">);
    if (!school) throw new Error("School not found");

    return await ctx.db.insert("schoolChangeRequests", {
      schoolId: user.schoolId as Id<"schools">,
      requestedBy: user._id,
      field: "name" as const,
      currentValue: school.name,
      requestedValue: args.requestedValue.trim(),
      status: "pending" as const,
      createdAt: Date.now(),
    });
  },
});
