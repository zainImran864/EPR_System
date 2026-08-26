import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Section timetable (admin builder + student/parent view) ──────────────────
export const getSectionTimetable = query({
  args: {
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
  },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("timetableSlots")
      .withIndex("by_section", (q) =>
        q
          .eq("schoolId", args.schoolId)
          .eq("classId", args.classId)
          .eq("sectionId", args.sectionId)
      )
      .collect();
    slots.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.period - b.period);
    return slots;
  },
});

// ─── Teacher timetable (their own lectures across sections) ──────────────────
export const getTeacherTimetable = query({
  args: { schoolId: v.id("schools"), teacherId: v.id("teachers") },
  handler: async (ctx, args) => {
    const slots = await ctx.db
      .query("timetableSlots")
      .withIndex("by_teacher", (q) =>
        q.eq("schoolId", args.schoolId).eq("teacherId", args.teacherId)
      )
      .collect();

    // Enrich with class/section names
    const enriched = await Promise.all(
      slots.map(async (s) => {
        const cls = await ctx.db.get(s.classId);
        const sec = await ctx.db.get(s.sectionId);
        return {
          ...s,
          className: cls?.name ?? "",
          sectionName: sec?.name ?? "",
        };
      })
    );
    enriched.sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.period - b.period);
    return enriched;
  },
});

// ─── Upsert a slot (admin) — one slot per (section, day, period) ─────────────
export const setSlot = mutation({
  args: {
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    dayOfWeek: v.number(),
    period: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    subjectName: v.string(),
    subjectId: v.optional(v.id("subjects")),
    teacherId: v.optional(v.id("teachers")),
    room: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let teacherName: string | undefined;
    if (args.teacherId) {
      const t = await ctx.db.get(args.teacherId);
      if (t) teacherName = `${t.firstName} ${t.lastName}`;
    }

    // Find existing slot for this cell
    const existing = (
      await ctx.db
        .query("timetableSlots")
        .withIndex("by_section", (q) =>
          q
            .eq("schoolId", args.schoolId)
            .eq("classId", args.classId)
            .eq("sectionId", args.sectionId)
        )
        .collect()
    ).find((s) => s.dayOfWeek === args.dayOfWeek && s.period === args.period);

    const doc = {
      schoolId: args.schoolId,
      classId: args.classId,
      sectionId: args.sectionId,
      dayOfWeek: args.dayOfWeek,
      period: args.period,
      startTime: args.startTime,
      endTime: args.endTime,
      subjectName: args.subjectName,
      subjectId: args.subjectId,
      teacherId: args.teacherId,
      teacherName,
      room: args.room,
    };

    if (existing) {
      await ctx.db.patch(existing._id, doc);
      return existing._id;
    }
    return await ctx.db.insert("timetableSlots", doc);
  },
});

export const deleteSlot = mutation({
  args: { slotId: v.id("timetableSlots") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.slotId);
  },
});
