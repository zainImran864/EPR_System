import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

function billStatus(total: number, paid: number): "unpaid" | "partial" | "paid" {
  if (paid <= 0) return "unpaid";
  if (paid >= total) return "paid";
  return "partial";
}

// ─── Generate bills for a whole class/section at once ─────────────────────────
export const generateBills = mutation({
  args: {
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    sectionId: v.optional(v.id("sections")),
    title: v.string(),
    heads: v.array(v.object({ name: v.string(), amount: v.number() })),
    issueDate: v.string(),
    dueDate: v.string(),
  },
  handler: async (ctx, args) => {
    const total = args.heads.reduce((s, h) => s + Math.max(0, h.amount), 0);

    let students = await ctx.db
      .query("students")
      .withIndex("by_schoolId_and_classId", (q) =>
        q.eq("schoolId", args.schoolId).eq("classId", args.classId)
      )
      .collect();
    if (args.sectionId) students = students.filter((s) => s.sectionId === args.sectionId);
    students = students.filter((s) => s.status === "active");

    let created = 0;
    for (const s of students) {
      await ctx.db.insert("feeBills", {
        schoolId: args.schoolId,
        studentId: s._id,
        classId: s.classId,
        sectionId: s.sectionId,
        title: args.title,
        heads: args.heads,
        totalAmount: total,
        paidAmount: 0,
        issueDate: args.issueDate,
        dueDate: args.dueDate,
        status: "unpaid",
        createdAt: Date.now(),
      });
      created++;
    }
    return { created, total };
  },
});

// ─── List bills (admin) with student names ───────────────────────────────────
export const listBills = query({
  args: {
    schoolId: v.id("schools"),
    classId: v.optional(v.id("classes")),
    sectionId: v.optional(v.id("sections")),
    status: v.optional(
      v.union(v.literal("unpaid"), v.literal("partial"), v.literal("paid"))
    ),
  },
  handler: async (ctx, args) => {
    let bills = await ctx.db
      .query("feeBills")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", args.schoolId))
      .collect();

    if (args.classId) bills = bills.filter((b) => b.classId === args.classId);
    if (args.sectionId) bills = bills.filter((b) => b.sectionId === args.sectionId);
    if (args.status) bills = bills.filter((b) => b.status === args.status);

    bills.sort((a, b) => b.createdAt - a.createdAt);

    return await Promise.all(
      bills.map(async (b) => {
        const s = await ctx.db.get(b.studentId);
        const sec = await ctx.db.get(b.sectionId);
        const cls = await ctx.db.get(b.classId);
        return {
          ...b,
          studentName: s ? `${s.firstName} ${s.lastName}` : "",
          admissionNumber: s?.admissionNumber ?? "",
          className: cls?.name ?? "",
          sectionName: sec?.name ?? "",
        };
      })
    );
  },
});

// ─── Bills for one student (parent/student view) ──────────────────────────────
export const getStudentBills = query({
  args: { schoolId: v.id("schools"), studentId: v.id("students") },
  handler: async (ctx, args) => {
    const bills = await ctx.db
      .query("feeBills")
      .withIndex("by_student", (q) =>
        q.eq("schoolId", args.schoolId).eq("studentId", args.studentId)
      )
      .collect();
    bills.sort((a, b) => b.createdAt - a.createdAt);
    return bills;
  },
});

// ─── Record a payment against a bill ──────────────────────────────────────────
export const recordPayment = mutation({
  args: { billId: v.id("feeBills"), amount: v.number() },
  handler: async (ctx, args) => {
    const bill = await ctx.db.get(args.billId);
    if (!bill) throw new Error("Bill not found");
    const paid = Math.max(0, Math.min(bill.totalAmount, bill.paidAmount + args.amount));
    await ctx.db.patch(args.billId, {
      paidAmount: paid,
      status: billStatus(bill.totalAmount, paid),
    });
    return { ok: true };
  },
});

// ─── Full challan payload (single bill, for the printable view) ───────────────
export const getChallan = query({
  args: { billId: v.id("feeBills") },
  handler: async (ctx, args) => {
    const bill = await ctx.db.get(args.billId);
    if (!bill) return null;
    const school = await ctx.db.get(bill.schoolId);
    const student = await ctx.db.get(bill.studentId);
    const cls = await ctx.db.get(bill.classId);
    const sec = await ctx.db.get(bill.sectionId);
    return {
      school: school
        ? { name: school.name, logoUrl: school.logoUrl ?? null, address: school.address ?? "" }
        : null,
      student: student
        ? {
            name: `${student.firstName} ${student.lastName}`,
            admissionNumber: student.admissionNumber,
            rollNumber: student.rollNumber,
            className: cls?.name ?? "",
            sectionName: sec?.name ?? "",
          }
        : null,
      bill,
    };
  },
});

// ─── Bulk challan payload (all bills in a section, for one print job) ─────────
export const getSectionChallans = query({
  args: {
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    title: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let bills = await ctx.db
      .query("feeBills")
      .withIndex("by_section", (q) =>
        q
          .eq("schoolId", args.schoolId)
          .eq("classId", args.classId)
          .eq("sectionId", args.sectionId)
      )
      .collect();
    if (args.title) bills = bills.filter((b) => b.title === args.title);

    const school = await ctx.db.get(args.schoolId);
    const cls = await ctx.db.get(args.classId);
    const sec = await ctx.db.get(args.sectionId);

    const challans = await Promise.all(
      bills.map(async (bill) => {
        const student = await ctx.db.get(bill.studentId);
        return {
          bill,
          student: student
            ? {
                name: `${student.firstName} ${student.lastName}`,
                admissionNumber: student.admissionNumber,
                rollNumber: student.rollNumber,
              }
            : null,
        };
      })
    );

    return {
      school: school
        ? { name: school.name, logoUrl: school.logoUrl ?? null, address: school.address ?? "" }
        : null,
      className: cls?.name ?? "",
      sectionName: sec?.name ?? "",
      challans,
    };
  },
});
