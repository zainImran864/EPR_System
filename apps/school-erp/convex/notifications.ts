import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Feed for the current user (role-targeted + direct + school-wide) ─────────
export const listForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return [];

    // School-scoped notifications for this tenant
    const schoolNotifs = user.schoolId
      ? await ctx.db
          .query("notifications")
          .withIndex("by_schoolId", (q) => q.eq("schoolId", user.schoolId))
          .collect()
      : [];

    // Directly targeted notifications
    const direct = await ctx.db
      .query("notifications")
      .withIndex("by_targetUser", (q) => q.eq("targetUserId", args.userId))
      .collect();

    const clearedAt = user.notificationsClearedAt ?? 0;
    const merged = [...schoolNotifs, ...direct].filter((n) => {
      if (n.createdAt <= clearedAt) return false;
      if (n.targetUserId) return n.targetUserId === args.userId;
      const aud = n.audienceRole ?? "all";
      return aud === "all" || aud === user.role;
    });

    // De-dupe + sort newest first
    const byId = new Map(merged.map((n) => [n._id, n]));
    const list = Array.from(byId.values()).sort((a, b) => b.createdAt - a.createdAt);

    // Read receipts
    const reads = await ctx.db
      .query("notificationReads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const readSet = new Set(reads.map((r) => r.notificationId));

    return list.map((n) => ({ ...n, isRead: readSet.has(n._id) }));
  },
});

export const unreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return 0;

    const schoolNotifs = user.schoolId
      ? await ctx.db
          .query("notifications")
          .withIndex("by_schoolId", (q) => q.eq("schoolId", user.schoolId))
          .collect()
      : [];
    const direct = await ctx.db
      .query("notifications")
      .withIndex("by_targetUser", (q) => q.eq("targetUserId", args.userId))
      .collect();

    const clearedAt = user.notificationsClearedAt ?? 0;
    const merged = [...schoolNotifs, ...direct].filter((n) => {
      if (n.createdAt <= clearedAt) return false;
      if (n.targetUserId) return n.targetUserId === args.userId;
      const aud = n.audienceRole ?? "all";
      return aud === "all" || aud === user.role;
    });
    const ids = new Set(merged.map((n) => n._id));

    const reads = await ctx.db
      .query("notificationReads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const readSet = new Set(reads.map((r) => r.notificationId));

    let count = 0;
    for (const id of ids) if (!readSet.has(id)) count++;
    return count;
  },
});

// ─── Admin broadcast ─────────────────────────────────────────────────────────
export const broadcast = mutation({
  args: {
    schoolId: v.id("schools"),
    createdBy: v.optional(v.id("users")),
    title: v.string(),
    body: v.string(),
    audienceRole: v.union(
      v.literal("all"),
      v.literal("admin"),
      v.literal("teacher"),
      v.literal("student"),
      v.literal("parent")
    ),
    kind: v.optional(
      v.union(
        v.literal("info"),
        v.literal("success"),
        v.literal("warning"),
        v.literal("announcement")
      )
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("notifications", {
      schoolId: args.schoolId,
      title: args.title,
      body: args.body,
      audienceRole: args.audienceRole,
      kind: args.kind ?? "announcement",
      createdBy: args.createdBy,
      createdAt: Date.now(),
    });
  },
});

export const markRead = mutation({
  args: { userId: v.id("users"), notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("notificationReads")
      .withIndex("by_user_and_notification", (q) =>
        q.eq("userId", args.userId).eq("notificationId", args.notificationId)
      )
      .first();
    if (!existing) {
      await ctx.db.insert("notificationReads", {
        userId: args.userId,
        notificationId: args.notificationId,
        readAt: Date.now(),
      });
    }
  },
});

// Per-user "delete all" — hides everything up to now (doesn't affect others).
export const clearAll = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, { notificationsClearedAt: Date.now() });
    return { ok: true };
  },
});

export const markAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const schoolNotifs = user.schoolId
      ? await ctx.db
          .query("notifications")
          .withIndex("by_schoolId", (q) => q.eq("schoolId", user.schoolId))
          .collect()
      : [];
    const direct = await ctx.db
      .query("notifications")
      .withIndex("by_targetUser", (q) => q.eq("targetUserId", args.userId))
      .collect();
    const merged = [...schoolNotifs, ...direct].filter((n) => {
      if (n.targetUserId) return n.targetUserId === args.userId;
      const aud = n.audienceRole ?? "all";
      return aud === "all" || aud === user.role;
    });

    const reads = await ctx.db
      .query("notificationReads")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const readSet = new Set(reads.map((r) => r.notificationId));

    for (const n of merged) {
      if (!readSet.has(n._id)) {
        await ctx.db.insert("notificationReads", {
          userId: args.userId,
          notificationId: n._id,
          readAt: Date.now(),
        });
      }
    }
  },
});
