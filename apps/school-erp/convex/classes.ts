import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// List all classes for a school with their sections
export const listClassesWithSections = query({
  args: { schoolId: v.id("schools") },
  handler: async (ctx, args) => {
    const classes = await ctx.db
      .query("classes")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Sort by numericGrade
    classes.sort((a, b) => a.numericGrade - b.numericGrade);

    const sections = await ctx.db
      .query("sections")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    // Count students per section
    const students = await ctx.db
      .query("students")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    const sectionsWithStats = sections.map((sec) => {
      const studentCount = students.filter(
        (s) => s.sectionId === sec._id && s.status === "active"
      ).length;
      return {
        ...sec,
        studentCount,
      };
    });

    return classes.map((cls) => ({
      ...cls,
      sections: sectionsWithStats.filter((sec) => sec.classId === cls._id),
      totalStudents: students.filter(
        (s) => s.classId === cls._id && s.status === "active"
      ).length,
    }));
  },
});

// Create a new class
export const createClass = mutation({
  args: {
    schoolId: v.id("schools"),
    name: v.string(),
    numericGrade: v.number(),
    academicYear: v.string(),
    sections: v.array(v.string()), // e.g. ["Section A", "Section B"]
  },
  handler: async (ctx, args) => {
    const classId = await ctx.db.insert("classes", {
      schoolId: args.schoolId,
      name: args.name,
      numericGrade: args.numericGrade,
      academicYear: args.academicYear,
    });

    // De-dupe section names within this class (case-insensitive).
    const seen = new Set<string>();
    for (const sectionName of args.sections) {
      const key = sectionName.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      await ctx.db.insert("sections", {
        schoolId: args.schoolId,
        classId,
        name: sectionName.trim(),
      });
    }

    return classId;
  },
});

// Edit a class (name / grade / academic year)
export const updateClass = mutation({
  args: {
    classId: v.id("classes"),
    name: v.optional(v.string()),
    numericGrade: v.optional(v.number()),
    academicYear: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { classId, ...fields } = args;
    const patch = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(classId, patch);
    return await ctx.db.get(classId);
  },
});

// Edit a section (name / room / class teacher). Section name unique within class.
export const updateSection = mutation({
  args: {
    sectionId: v.id("sections"),
    name: v.optional(v.string()),
    roomNumber: v.optional(v.string()),
    classTeacherId: v.optional(v.id("teachers")),
  },
  handler: async (ctx, args) => {
    const { sectionId, name, ...rest } = args;
    const section = await ctx.db.get(sectionId);
    if (!section) throw new Error("Section not found");

    if (name && name.trim()) {
      const siblings = await ctx.db
        .query("sections")
        .withIndex("by_classId", (q) => q.eq("classId", section.classId))
        .collect();
      const clash = siblings.some(
        (s) => s._id !== sectionId && s.name.trim().toLowerCase() === name.trim().toLowerCase()
      );
      if (clash) throw new Error("A section with this name already exists in this class");
    }

    const patch = Object.fromEntries(
      Object.entries({ name: name?.trim(), ...rest }).filter(([, v]) => v !== undefined)
    );
    await ctx.db.patch(sectionId, patch);
    return await ctx.db.get(sectionId);
  },
});

// Add a section to an existing class
export const addSection = mutation({
  args: {
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    name: v.string(),
    roomNumber: v.optional(v.string()),
    classTeacherId: v.optional(v.id("teachers")),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("sections", {
      schoolId: args.schoolId,
      classId: args.classId,
      name: args.name,
      roomNumber: args.roomNumber,
      classTeacherId: args.classTeacherId,
    });
  },
});
