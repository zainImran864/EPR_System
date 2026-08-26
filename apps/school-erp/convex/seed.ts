import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ─── Grade Helper ─────────────────────────────────────────────────────────────

function computeGrade(obtained: number, total: number): string {
  const pct = total > 0 ? (obtained / total) * 100 : 0;
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B";
  if (pct >= 60) return "C";
  if (pct >= 50) return "D";
  return "F";
}

// ─── Seed School ──────────────────────────────────────────────────────────────

export const seedSchool = mutation({
  args: {
    reset: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const SCHOOL_CODE = "OAK-RIDGE";

    // Idempotency guard
    const existing = await ctx.db
      .query("schools")
      .withIndex("by_code", (q) => q.eq("code", SCHOOL_CODE))
      .first();

    if (existing && !args.reset) {
      return { alreadySeeded: true, schoolId: existing._id };
    }

    const now = Date.now();

    // ── School ────────────────────────────────────────────────────────
    const schoolId = await ctx.db.insert("schools", {
      name: "Oakridge International Academy",
      code: SCHOOL_CODE,
      primaryColor: "#0D9488",
      activeYear: "2026-2027",
      phone: "+1-555-0100",
      email: "admin@oakridge.edu",
      address: "123 Oakridge Boulevard, Springfield, IL 62701",
      createdAt: now,
    });

    // ── Classes ───────────────────────────────────────────────────────
    const grade9Id = await ctx.db.insert("classes", {
      schoolId,
      name: "Grade 9",
      numericGrade: 9,
      academicYear: "2026-2027",
    });

    const grade10Id = await ctx.db.insert("classes", {
      schoolId,
      name: "Grade 10",
      numericGrade: 10,
      academicYear: "2026-2027",
    });

    // ── Teachers (insert before sections so we can assign classTeacherId) ──
    const teachers = [
      {
        firstName: "Eleanor",
        lastName: "Hayes",
        employeeId: "TCH-1001",
        email: "e.hayes@oakridge.edu",
        phone: "+1-555-0201",
        designation: "Senior Mathematics Faculty",
        department: "Mathematics",
        joinDate: "2020-08-15",
      },
      {
        firstName: "Marcus",
        lastName: "Patel",
        employeeId: "TCH-1002",
        email: "m.patel@oakridge.edu",
        phone: "+1-555-0202",
        designation: "Senior Science Faculty",
        department: "Science",
        joinDate: "2019-07-01",
      },
      {
        firstName: "Sophia",
        lastName: "Nguyen",
        employeeId: "TCH-1003",
        email: "s.nguyen@oakridge.edu",
        phone: "+1-555-0203",
        designation: "English Literature Faculty",
        department: "English",
        joinDate: "2021-08-10",
      },
      {
        firstName: "David",
        lastName: "Okonkwo",
        employeeId: "TCH-1004",
        email: "d.okonkwo@oakridge.edu",
        phone: "+1-555-0204",
        designation: "History & Geography Faculty",
        department: "Social Studies",
        joinDate: "2022-01-03",
      },
    ];

    const teacherIds: Id<"teachers">[] = [];
    for (const t of teachers) {
      const id = await ctx.db.insert("teachers", {
        schoolId,
        ...t,
        status: "active",
      });
      teacherIds.push(id);
    }

    const [hayesId, patelId, nguyenId, okonkwoId] = teacherIds;

    // ── Sections ──────────────────────────────────────────────────────
    const sec9AId = await ctx.db.insert("sections", {
      schoolId,
      classId: grade9Id,
      name: "Section A",
      roomNumber: "101",
      classTeacherId: hayesId,
    });

    const sec9BId = await ctx.db.insert("sections", {
      schoolId,
      classId: grade9Id,
      name: "Section B",
      roomNumber: "102",
      classTeacherId: nguyenId,
    });

    const sec10AId = await ctx.db.insert("sections", {
      schoolId,
      classId: grade10Id,
      name: "Section A",
      roomNumber: "201",
      classTeacherId: patelId,
    });

    const sec10BId = await ctx.db.insert("sections", {
      schoolId,
      classId: grade10Id,
      name: "Section B",
      roomNumber: "202",
      classTeacherId: okonkwoId,
    });

    // ── Subjects ──────────────────────────────────────────────────────
    const subjectDefs = [
      { name: "Mathematics", code: "MATH", creditHours: 5 },
      { name: "English", code: "ENG", creditHours: 4 },
      { name: "Science", code: "SCI", creditHours: 4 },
      { name: "History", code: "HIST", creditHours: 3 },
      { name: "Geography", code: "GEO", creditHours: 3 },
      { name: "Computer Science", code: "CS", creditHours: 3 },
    ];

    const subjectIds: Id<"subjects">[] = [];
    for (const s of subjectDefs) {
      const id = await ctx.db.insert("subjects", { schoolId, ...s });
      subjectIds.push(id);
    }

    const [mathId, engId, sciId] = subjectIds;

    // ── Students (spread across four sections) ────────────────────────
    type StudentSeed = {
      classId: Id<"classes">;
      sectionId: Id<"sections">;
      firstName: string;
      lastName: string;
      adm: string;
      roll: string;
      gender: "male" | "female" | "other";
      dob: string;
      guardianName: string;
      guardianPhone: string;
      guardianEmail: string;
      bloodGroup: string;
    };

    const studentSeeds: StudentSeed[] = [
      // Grade 9 – Section A (5 students)
      { classId: grade9Id, sectionId: sec9AId, firstName: "Aisha", lastName: "Rahman", adm: "ADM-2026-001", roll: "9-A-01", gender: "female", dob: "2011-03-15", guardianName: "Tariq Rahman", guardianPhone: "+1-555-1001", guardianEmail: "t.rahman@mail.com", bloodGroup: "B+" },
      { classId: grade9Id, sectionId: sec9AId, firstName: "Liam", lastName: "Chen", adm: "ADM-2026-002", roll: "9-A-02", gender: "male", dob: "2011-07-22", guardianName: "Wei Chen", guardianPhone: "+1-555-1002", guardianEmail: "w.chen@mail.com", bloodGroup: "O+" },
      { classId: grade9Id, sectionId: sec9AId, firstName: "Fatima", lastName: "Al-Sayed", adm: "ADM-2026-003", roll: "9-A-03", gender: "female", dob: "2011-01-09", guardianName: "Hassan Al-Sayed", guardianPhone: "+1-555-1003", guardianEmail: "h.alsayed@mail.com", bloodGroup: "A+" },
      { classId: grade9Id, sectionId: sec9AId, firstName: "Noah", lastName: "Williams", adm: "ADM-2026-004", roll: "9-A-04", gender: "male", dob: "2011-11-30", guardianName: "James Williams", guardianPhone: "+1-555-1004", guardianEmail: "j.williams@mail.com", bloodGroup: "AB+" },
      { classId: grade9Id, sectionId: sec9AId, firstName: "Priya", lastName: "Sharma", adm: "ADM-2026-005", roll: "9-A-05", gender: "female", dob: "2011-05-18", guardianName: "Rajesh Sharma", guardianPhone: "+1-555-1005", guardianEmail: "r.sharma@mail.com", bloodGroup: "O-" },
      // Grade 9 – Section B (4 students)
      { classId: grade9Id, sectionId: sec9BId, firstName: "Ethan", lastName: "Johnson", adm: "ADM-2026-006", roll: "9-B-01", gender: "male", dob: "2011-08-04", guardianName: "Michael Johnson", guardianPhone: "+1-555-1006", guardianEmail: "m.johnson@mail.com", bloodGroup: "A-" },
      { classId: grade9Id, sectionId: sec9BId, firstName: "Zara", lastName: "Khan", adm: "ADM-2026-007", roll: "9-B-02", gender: "female", dob: "2011-02-27", guardianName: "Imran Khan", guardianPhone: "+1-555-1007", guardianEmail: "i.khan@mail.com", bloodGroup: "B-" },
      { classId: grade9Id, sectionId: sec9BId, firstName: "Oliver", lastName: "Martinez", adm: "ADM-2026-008", roll: "9-B-03", gender: "male", dob: "2011-09-12", guardianName: "Carlos Martinez", guardianPhone: "+1-555-1008", guardianEmail: "c.martinez@mail.com", bloodGroup: "O+" },
      { classId: grade9Id, sectionId: sec9BId, firstName: "Mei", lastName: "Zhang", adm: "ADM-2026-009", roll: "9-B-04", gender: "female", dob: "2011-04-03", guardianName: "Jian Zhang", guardianPhone: "+1-555-1009", guardianEmail: "j.zhang@mail.com", bloodGroup: "AB-" },
      // Grade 10 – Section A (5 students)
      { classId: grade10Id, sectionId: sec10AId, firstName: "Amara", lastName: "Diallo", adm: "ADM-2026-010", roll: "10-A-01", gender: "female", dob: "2010-06-21", guardianName: "Mamadou Diallo", guardianPhone: "+1-555-1010", guardianEmail: "m.diallo@mail.com", bloodGroup: "B+" },
      { classId: grade10Id, sectionId: sec10AId, firstName: "James", lastName: "Osei", adm: "ADM-2026-011", roll: "10-A-02", gender: "male", dob: "2010-10-15", guardianName: "Kwame Osei", guardianPhone: "+1-555-1011", guardianEmail: "k.osei@mail.com", bloodGroup: "A+" },
      { classId: grade10Id, sectionId: sec10AId, firstName: "Isabella", lastName: "Costa", adm: "ADM-2026-012", roll: "10-A-03", gender: "female", dob: "2010-12-08", guardianName: "Paulo Costa", guardianPhone: "+1-555-1012", guardianEmail: "p.costa@mail.com", bloodGroup: "O+" },
      { classId: grade10Id, sectionId: sec10AId, firstName: "Arjun", lastName: "Nair", adm: "ADM-2026-013", roll: "10-A-04", gender: "male", dob: "2010-03-25", guardianName: "Suresh Nair", guardianPhone: "+1-555-1013", guardianEmail: "s.nair@mail.com", bloodGroup: "O-" },
      { classId: grade10Id, sectionId: sec10AId, firstName: "Chloe", lastName: "Park", adm: "ADM-2026-014", roll: "10-A-05", gender: "female", dob: "2010-07-14", guardianName: "Jin-ho Park", guardianPhone: "+1-555-1014", guardianEmail: "jh.park@mail.com", bloodGroup: "A-" },
      // Grade 10 – Section B (5 students)
      { classId: grade10Id, sectionId: sec10BId, firstName: "Ryan", lastName: "Thompson", adm: "ADM-2026-015", roll: "10-B-01", gender: "male", dob: "2010-01-19", guardianName: "Scott Thompson", guardianPhone: "+1-555-1015", guardianEmail: "s.thompson@mail.com", bloodGroup: "B+" },
      { classId: grade10Id, sectionId: sec10BId, firstName: "Layla", lastName: "Hassan", adm: "ADM-2026-016", roll: "10-B-02", gender: "female", dob: "2010-09-07", guardianName: "Omar Hassan", guardianPhone: "+1-555-1016", guardianEmail: "o.hassan@mail.com", bloodGroup: "AB+" },
      { classId: grade10Id, sectionId: sec10BId, firstName: "Kai", lastName: "Tanaka", adm: "ADM-2026-017", roll: "10-B-03", gender: "male", dob: "2010-05-30", guardianName: "Hiro Tanaka", guardianPhone: "+1-555-1017", guardianEmail: "h.tanaka@mail.com", bloodGroup: "A+" },
      { classId: grade10Id, sectionId: sec10BId, firstName: "Sofia", lastName: "Reyes", adm: "ADM-2026-018", roll: "10-B-04", gender: "female", dob: "2010-11-22", guardianName: "Miguel Reyes", guardianPhone: "+1-555-1018", guardianEmail: "m.reyes@mail.com", bloodGroup: "O+" },
      { classId: grade10Id, sectionId: sec10BId, firstName: "Lucas", lastName: "Andersen", adm: "ADM-2026-019", roll: "10-B-05", gender: "male", dob: "2010-04-11", guardianName: "Bjorn Andersen", guardianPhone: "+1-555-1019", guardianEmail: "b.andersen@mail.com", bloodGroup: "B-" },
    ];

    const studentIds: Id<"students">[] = [];
    for (const seed of studentSeeds) {
      const id = await ctx.db.insert("students", {
        schoolId,
        classId: seed.classId,
        sectionId: seed.sectionId,
        firstName: seed.firstName,
        lastName: seed.lastName,
        admissionNumber: seed.adm,
        rollNumber: seed.roll,
        gender: seed.gender,
        dob: seed.dob,
        bloodGroup: seed.bloodGroup,
        guardianName: seed.guardianName,
        guardianPhone: seed.guardianPhone,
        guardianEmail: seed.guardianEmail,
        address: "123 Student St, Springfield, IL",
        status: "active",
        enrollmentDate: "2026-08-01",
      });
      studentIds.push(id);
    }

    // ── Exams ─────────────────────────────────────────────────────────
    const midTermId = await ctx.db.insert("exams", {
      schoolId,
      name: "Mid-Term Examination 2026",
      term: "Term 1",
      startDate: "2026-10-01",
      endDate: "2026-10-10",
      academicYear: "2026-2027",
      isPublished: true,
    });

    await ctx.db.insert("exams", {
      schoolId,
      name: "Final Examination 2026",
      term: "Term 2",
      startDate: "2027-02-15",
      endDate: "2027-02-25",
      academicYear: "2026-2027",
      isPublished: false,
    });

    // ── Marks for Mid-Term (Math + Science, Grade 10 Section A) ───────
    // Indices 0-4 = Grade 9 Sec A, 5-8 = Gr9 SecB, 9-13 = Gr10 SecA, 14-18 = Gr10 SecB
    const gr10AStudentIds = studentIds.slice(9, 14);

    type MarksSeed = { studentId: Id<"students">; mathObtained: number; sciObtained: number };
    const marksData: MarksSeed[] = [
      { studentId: gr10AStudentIds[0], mathObtained: 92, sciObtained: 88 },
      { studentId: gr10AStudentIds[1], mathObtained: 78, sciObtained: 81 },
      { studentId: gr10AStudentIds[2], mathObtained: 65, sciObtained: 70 },
      { studentId: gr10AStudentIds[3], mathObtained: 85, sciObtained: 79 },
      { studentId: gr10AStudentIds[4], mathObtained: 55, sciObtained: 60 },
    ];

    for (const m of marksData) {
      const total = 100;
      await ctx.db.insert("marks", {
        schoolId,
        examId: midTermId,
        studentId: m.studentId,
        classId: grade10Id,
        sectionId: sec10AId,
        subjectId: mathId,
        totalMarks: total,
        obtainedMarks: m.mathObtained,
        grade: computeGrade(m.mathObtained, total),
      });
      await ctx.db.insert("marks", {
        schoolId,
        examId: midTermId,
        studentId: m.studentId,
        classId: grade10Id,
        sectionId: sec10AId,
        subjectId: sciId,
        totalMarks: total,
        obtainedMarks: m.sciObtained,
        grade: computeGrade(m.sciObtained, total),
      });
    }

    // ── Attendance seed for "2026-08-25" (Grade 10 Section A) ────────
    const attendanceDate = "2026-08-25";
    type AttStatus = "present" | "absent" | "late" | "excused";
    const attendanceStatuses: AttStatus[] = ["present", "present", "absent", "late", "present"];

    for (let i = 0; i < gr10AStudentIds.length; i++) {
      await ctx.db.insert("attendance", {
        schoolId,
        date: attendanceDate,
        classId: grade10Id,
        sectionId: sec10AId,
        studentId: gr10AStudentIds[i],
        status: attendanceStatuses[i],
        recordedBy: "Eleanor Hayes",
      });
    }

    // Also seed attendance for Grade 10 Section B on the same date
    const gr10BStudentIds = studentIds.slice(14, 19);
    const attendanceStatusesB: AttStatus[] = ["present", "late", "present", "excused", "present"];

    for (let i = 0; i < gr10BStudentIds.length; i++) {
      await ctx.db.insert("attendance", {
        schoolId,
        date: attendanceDate,
        classId: grade10Id,
        sectionId: sec10BId,
        studentId: gr10BStudentIds[i],
        status: attendanceStatusesB[i],
        recordedBy: "David Okonkwo",
      });
    }

    return {
      alreadySeeded: false,
      schoolId,
      counts: {
        classes: 2,
        sections: 4,
        subjects: subjectDefs.length,
        teachers: teachers.length,
        students: studentSeeds.length,
        exams: 2,
        marks: marksData.length * 2,
        attendanceRows: gr10AStudentIds.length + gr10BStudentIds.length,
      },
    };
  },
});
