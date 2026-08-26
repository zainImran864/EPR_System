import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ─── Section Roster with Attendance Status ────────────────────────────────────

export const getSectionRoster = query({
  args: {
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Active students for this section
    const students = await ctx.db
      .query("students")
      .withIndex("by_schoolId_and_sectionId", (q) =>
        q.eq("schoolId", args.schoolId).eq("sectionId", args.sectionId)
      )
      .collect()
      .then((rows) => rows.filter((s) => s.status === "active"));

    // Existing attendance records for this section + date
    const existing = await ctx.db
      .query("attendance")
      .withIndex("by_section_and_date", (q) =>
        q
          .eq("schoolId", args.schoolId)
          .eq("classId", args.classId)
          .eq("sectionId", args.sectionId)
          .eq("date", args.date)
      )
      .collect();

    const attendanceMap = new Map(existing.map((a) => [a.studentId, a]));

    const roster = students.map((s) => {
      const record = attendanceMap.get(s._id);
      return {
        studentId: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        rollNumber: s.rollNumber,
        status: record?.status ?? "present",
        remarks: record?.remarks ?? "",
      };
    });

    roster.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber));

    return roster;
  },
});

// ─── Save Attendance (Upsert) ─────────────────────────────────────────────────

export const saveAttendance = mutation({
  args: {
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    date: v.string(),
    records: v.array(
      v.object({
        studentId: v.id("students"),
        status: v.union(
          v.literal("present"),
          v.literal("absent"),
          v.literal("late"),
          v.literal("excused")
        ),
        remarks: v.optional(v.string()),
      })
    ),
    recordedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let saved = 0;

    for (const record of args.records) {
      // Look for an existing row by student + date scoped to school
      const existing = await ctx.db
        .query("attendance")
        .withIndex("by_student_and_date", (q) =>
          q
            .eq("schoolId", args.schoolId)
            .eq("studentId", record.studentId)
            .eq("date", args.date)
        )
        .first();

      if (existing) {
        await ctx.db.patch(existing._id, {
          status: record.status,
          remarks: record.remarks,
          recordedBy: args.recordedBy,
        });
      } else {
        await ctx.db.insert("attendance", {
          schoolId: args.schoolId,
          classId: args.classId,
          sectionId: args.sectionId,
          date: args.date,
          studentId: record.studentId,
          status: record.status,
          remarks: record.remarks,
          recordedBy: args.recordedBy,
        });
      }

      saved++;
    }

    return { saved };
  },
});

// ─── School-Wide Attendance Summary for a Date ───────────────────────────────

export const getAttendanceSummary = query({
  args: {
    schoolId: v.id("schools"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("attendance")
      .withIndex("by_schoolId_and_date", (q) =>
        q.eq("schoolId", args.schoolId).eq("date", args.date)
      )
      .collect();

    if (rows.length === 0) {
      return { total: 0, present: 0, absent: 0, late: 0, excused: 0, presentRate: null };
    }

    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const row of rows) {
      counts[row.status]++;
    }

    const total = rows.length;
    const presentRate = Math.round(((counts.present + counts.late) / total) * 100);

    return { total, ...counts, presentRate };
  },
});
