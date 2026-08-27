import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { hashPassword, verifyPassword, generateToken } from "./lib/hash";
import { generateSecret, otpauthUrl, verifyTotp } from "./lib/totp";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const TOTP_ISSUER = process.env.TOTP_ISSUER || "AcademiX";

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
    const nameChanged = Boolean(
      args.name && args.name.trim() && args.name.trim() !== user.name
    );
    if (args.name && args.name.trim()) patch.name = args.name.trim();
    if (args.phone !== undefined) patch.phone = args.phone;
    await ctx.db.patch(user._id, patch);

    // Keep the linked teacher/student profile row + admin roster in sync.
    if (nameChanged) {
      const newName = args.name!.trim();
      const [first, ...rest] = newName.split(/\s+/);
      const last = rest.join(" ");

      if (user.linkedTeacherId) {
        await ctx.db.patch(user.linkedTeacherId, {
          firstName: first,
          lastName: last,
        });
      }
      if (user.linkedStudentId) {
        await ctx.db.patch(user.linkedStudentId, {
          firstName: first,
          lastName: last,
        });
      }

      // Notify the school's admins that a user updated their profile (real-time).
      if (user.schoolId && user.role !== "admin" && user.role !== "superadmin") {
        await ctx.db.insert("notifications", {
          schoolId: user.schoolId,
          title: "Profile updated",
          body: `${newName} (${user.role}) updated their profile.`,
          audienceRole: "admin",
          kind: "info",
          createdBy: user._id,
          createdAt: Date.now(),
        });
      }
    }
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

// ─── Two-factor: start setup → returns secret + otpauth URL for the QR ────────
export const startTwoFactorSetup = mutation({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const secret = generateSecret();
    // Store the pending secret; 2FA stays disabled until a code is confirmed.
    await ctx.db.patch(user._id, {
      twoFactorSecret: secret,
      twoFactorEnabled: false,
    });
    return {
      secret,
      otpauthUrl: otpauthUrl(secret, user.email, TOTP_ISSUER),
      issuer: TOTP_ISSUER,
      account: user.email,
    };
  },
});

// Confirm the code → enable 2FA
export const confirmTwoFactor = mutation({
  args: { token: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    if (!user.twoFactorSecret) return { ok: false as const, error: "no-setup" as const };
    const ok = await verifyTotp(user.twoFactorSecret, args.code);
    if (!ok) return { ok: false as const, error: "bad-code" as const };
    await ctx.db.patch(user._id, { twoFactorEnabled: true });
    return { ok: true as const };
  },
});

// Disable 2FA — requires a valid current code
export const disableTwoFactor = mutation({
  args: { token: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    if (!user.twoFactorEnabled || !user.twoFactorSecret)
      return { ok: false as const, error: "not-enabled" as const };
    const ok = await verifyTotp(user.twoFactorSecret, args.code);
    if (!ok) return { ok: false as const, error: "bad-code" as const };
    await ctx.db.patch(user._id, {
      twoFactorEnabled: false,
      twoFactorSecret: undefined,
    });
    // Drop all remembered devices when 2FA is turned off.
    const devices = await ctx.db
      .query("trustedDevices")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .collect();
    for (const d of devices) await ctx.db.delete(d._id);
    return { ok: true as const };
  },
});

// ─── Trusted devices ──────────────────────────────────────────────────────────
export const listTrustedDevices = query({
  args: { token: v.string() },
  handler: async (ctx: QueryCtx, args) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", args.token))
      .first();
    if (!session || session.expiresAt < Date.now()) return [];
    const devices = await ctx.db
      .query("trustedDevices")
      .withIndex("by_userId", (q) => q.eq("userId", session.userId))
      .collect();
    devices.sort((a, b) => b.lastUsedAt - a.lastUsedAt);
    return devices.map((d) => ({
      _id: d._id,
      label: d.label,
      createdAt: d.createdAt,
      lastUsedAt: d.lastUsedAt,
    }));
  },
});

export const deleteTrustedDevice = mutation({
  args: { token: v.string(), deviceId: v.id("trustedDevices") },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    const device = await ctx.db.get(args.deviceId);
    if (device && device.userId === user._id) await ctx.db.delete(args.deviceId);
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

// ─── Per-user sidebar theme color ─────────────────────────────────────────────
export const setThemeColor = mutation({
  args: { token: v.string(), color: v.string() },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx, args.token);
    await ctx.db.patch(user._id, { themeColor: args.color });
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
