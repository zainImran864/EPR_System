import { mutation } from "./_generated/server";
import { hashPassword } from "./lib/hash";
import { buildEmail } from "./lib/identity";

/**
 * One-shot idempotent demo seed: super-admin + an approved school + admin +
 * class/section + a teacher + a student (with its parent). Returns every login.
 * Run with:  npx convex run demo:seedScenario
 */
export const seedScenario = mutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const slug = "oakridge";

    const SUPER = { name: "adminnn", email: "admin321@erp.com", password: "Test-123" };
    const ADMIN_PW = "Admin-123";
    const TEACHER_PW = "Teacher-123";
    const PORTAL_PW = "Student-123"; // shared by student + parent

    const byEmail = (email: string) =>
      ctx.db.query("users").withIndex("by_email", (q) => q.eq("email", email)).first();

    // 1) Super admin
    if (!(await byEmail(SUPER.email))) {
      const { hash, salt } = await hashPassword(SUPER.password);
      await ctx.db.insert("users", {
        name: SUPER.name,
        email: SUPER.email,
        role: "superadmin",
        passwordHash: hash,
        passwordSalt: salt,
        status: "active",
        createdAt: now,
      });
    }

    // 2) School (upsert by code)
    let school = await ctx.db
      .query("schools")
      .withIndex("by_code", (q) => q.eq("code", "OAKRIDGE"))
      .first();
    const schoolId =
      school?._id ??
      (await ctx.db.insert("schools", {
        name: "Oakridge School",
        code: "OAKRIDGE",
        primaryColor: "#0D9488",
        activeYear: "2026-2027",
        email: "info@oakridge.com",
        phone: "+1 555 100 2000",
        address: "12 Campus Drive",
        createdAt: now,
      }));

    // 3) School admin
    const adminEmail = buildEmail("Sara", "admin", slug); // saraadmin@oakridge.com
    if (!(await byEmail(adminEmail))) {
      const { hash, salt } = await hashPassword(ADMIN_PW);
      await ctx.db.insert("users", {
        schoolId,
        name: "Sara Admin",
        email: adminEmail,
        role: "admin",
        passwordHash: hash,
        passwordSalt: salt,
        status: "active",
        createdAt: now,
      });
    }

    // 4) Class + section
    let cls = (
      await ctx.db.query("classes").withIndex("by_schoolId", (q) => q.eq("schoolId", schoolId)).collect()
    ).find((c) => c.numericGrade === 10);
    const classId =
      cls?._id ??
      (await ctx.db.insert("classes", {
        schoolId,
        name: "Grade 10",
        numericGrade: 10,
        academicYear: "2026-2027",
      }));
    let sec = (
      await ctx.db.query("sections").withIndex("by_classId", (q) => q.eq("classId", classId)).collect()
    )[0];
    const sectionId =
      sec?._id ??
      (await ctx.db.insert("sections", { schoolId, classId, name: "Section A" }));

    // 5) Teacher (+ login)
    const teacherEmail = buildEmail("Ali", "teacher", slug); // aliT@oakridge.com
    let teacherId =
      (
        await ctx.db.query("teachers").withIndex("by_schoolId", (q) => q.eq("schoolId", schoolId)).collect()
      ).find((t) => t.email === teacherEmail)?._id ?? null;
    if (!teacherId) {
      teacherId = await ctx.db.insert("teachers", {
        schoolId,
        firstName: "Ali",
        lastName: "Khan",
        employeeId: "EMP-001",
        email: teacherEmail,
        designation: "Senior Teacher",
        department: "Science",
        status: "active",
      });
      const { hash, salt } = await hashPassword(TEACHER_PW);
      await ctx.db.insert("users", {
        schoolId,
        name: "Ali Khan",
        email: teacherEmail,
        role: "teacher",
        passwordHash: hash,
        passwordSalt: salt,
        status: "active",
        linkedTeacherId: teacherId,
        mustChangePassword: true,
        createdAt: now,
      });
    }
    // Make Ali the class teacher of Section A
    await ctx.db.patch(sectionId, { classTeacherId: teacherId });

    // 6) Student (+ parent)
    const studentEmail = buildEmail("Zara", "student", slug); // zaraS@oakridge.com
    const parentEmail = buildEmail("Zara", "parent", slug); // zaraP@oakridge.com
    let studentId =
      (
        await ctx.db.query("students").withIndex("by_schoolId", (q) => q.eq("schoolId", schoolId)).collect()
      ).find((s) => s.admissionNumber === "ADM-2026-001")?._id ?? null;
    if (!studentId) {
      studentId = await ctx.db.insert("students", {
        schoolId,
        classId,
        sectionId,
        firstName: "Zara",
        lastName: "Ahmed",
        admissionNumber: "ADM-2026-001",
        rollNumber: "10-A-01",
        gender: "female",
        guardianName: "Bilal Ahmed",
        guardianPhone: "+1 555 300 4000",
        status: "active",
        enrollmentDate: "2026-08-01",
      });
      const { hash, salt } = await hashPassword(PORTAL_PW);
      await ctx.db.insert("users", {
        schoolId,
        name: "Zara Ahmed",
        email: studentEmail,
        role: "student",
        passwordHash: hash,
        passwordSalt: salt,
        status: "active",
        linkedStudentId: studentId,
        mustChangePassword: true,
        createdAt: now,
      });
      const parentUserId = await ctx.db.insert("users", {
        schoolId,
        name: "Bilal Ahmed",
        email: parentEmail,
        role: "parent",
        passwordHash: hash,
        passwordSalt: salt,
        status: "active",
        mustChangePassword: true,
        createdAt: now,
      });
      await ctx.db.patch(studentId, { linkedParentUserId: parentUserId });
    }

    // 7) Subjects (idempotent by code)
    const subjectDefs = [
      { name: "Mathematics", code: "MATH-10" },
      { name: "Science", code: "SCI-10" },
      { name: "English", code: "ENG-10" },
    ];
    const existingSubjects = await ctx.db
      .query("subjects")
      .withIndex("by_schoolId", (q) => q.eq("schoolId", schoolId))
      .collect();
    const subjectIds: Record<string, string> = {};
    for (const def of subjectDefs) {
      const found = existingSubjects.find((s) => s.code === def.code);
      subjectIds[def.name] = found
        ? found._id
        : await ctx.db.insert("subjects", { schoolId, name: def.name, code: def.code });
    }

    // 8) Timetable — Mon–Fri, a few periods (idempotent if empty)
    const existingSlots = await ctx.db
      .query("timetableSlots")
      .withIndex("by_section", (q) =>
        q.eq("schoolId", schoolId).eq("classId", classId).eq("sectionId", sectionId)
      )
      .collect();
    if (existingSlots.length === 0) {
      const periods = [
        { period: 1, startTime: "08:00", endTime: "08:45", subject: "Mathematics" },
        { period: 2, startTime: "08:45", endTime: "09:30", subject: "Science" },
        { period: 3, startTime: "09:30", endTime: "10:15", subject: "English" },
      ];
      for (let day = 1; day <= 5; day++) {
        for (const p of periods) {
          await ctx.db.insert("timetableSlots", {
            schoolId,
            classId,
            sectionId,
            dayOfWeek: day,
            period: p.period,
            startTime: p.startTime,
            endTime: p.endTime,
            subjectName: p.subject,
            subjectId: subjectIds[p.subject] as any,
            teacherId: teacherId as any,
            teacherName: "Ali Khan",
            room: "204",
          });
        }
      }
    }

    // 9) Exam + marks (drives the report card)
    let exam = (
      await ctx.db.query("exams").withIndex("by_schoolId", (q) => q.eq("schoolId", schoolId)).collect()
    ).find((e) => e.name === "Mid-Term Examination 2026");
    const examId =
      exam?._id ??
      (await ctx.db.insert("exams", {
        schoolId,
        name: "Mid-Term Examination 2026",
        term: "Term 1",
        startDate: "2026-10-01",
        endDate: "2026-10-10",
        academicYear: "2026-2027",
        isPublished: true,
      }));
    const existingMarks = (
      await ctx.db
        .query("marks")
        .withIndex("by_school_exam_student", (q) =>
          q.eq("schoolId", schoolId).eq("examId", examId).eq("studentId", studentId!)
        )
        .collect()
    );
    if (existingMarks.length === 0) {
      const scores = [
        { subject: "Mathematics", obtained: 88, grade: "A" },
        { subject: "Science", obtained: 92, grade: "A+" },
        { subject: "English", obtained: 79, grade: "B" },
      ];
      for (const s of scores) {
        await ctx.db.insert("marks", {
          schoolId,
          examId,
          studentId: studentId!,
          classId,
          sectionId,
          subjectId: subjectIds[s.subject] as any,
          totalMarks: 100,
          obtainedMarks: s.obtained,
          grade: s.grade,
        });
      }
    }

    // 10) Fee bill for the student
    const existingBills = await ctx.db
      .query("feeBills")
      .withIndex("by_student", (q) => q.eq("schoolId", schoolId).eq("studentId", studentId!))
      .collect();
    if (existingBills.length === 0) {
      const heads = [
        { name: "Tuition Fee", amount: 3000 },
        { name: "Examination Fee", amount: 500 },
        { name: "Library Fee", amount: 200 },
      ];
      const total = heads.reduce((a, h) => a + h.amount, 0);
      await ctx.db.insert("feeBills", {
        schoolId,
        studentId: studentId!,
        classId,
        sectionId,
        title: "Term 1 Fees 2026",
        heads,
        totalAmount: total,
        paidAmount: 0,
        issueDate: "2026-09-01",
        dueDate: "2026-09-30",
        status: "unpaid",
        createdAt: now,
      });
    }

    return {
      superAdmin: { email: SUPER.email, password: SUPER.password },
      schoolAdmin: { email: adminEmail, password: ADMIN_PW },
      teacher: { email: teacherEmail, password: TEACHER_PW },
      student: { email: studentEmail, password: PORTAL_PW },
      parent: { email: parentEmail, password: PORTAL_PW },
    };
  },
});
