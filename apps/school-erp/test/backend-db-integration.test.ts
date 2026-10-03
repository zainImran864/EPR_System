import { describe, it, expect, beforeAll } from "vitest";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api";

describe("School ERP Full Backend & DB End-to-End Integration Suite", () => {
  let adminToken = "";
  let teacherToken = "";
  let studentToken = "";
  let parentToken = "";

  let adminUser: any = null;
  let teacherUser: any = null;
  let studentUser: any = null;
  let parentUser: any = null;

  let activeClassId = "";
  let activeSectionId = "";
  let activeSubjectId = "";
  let activeTeacherId = "";
  let activeStudentId = "";
  let activeExamTermId = "";

  // Helper fetcher
  async function api(path: string, options: RequestInit = {}, token?: string) {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
    });
    const json = await res.json().catch(() => ({}));
    const data = json && typeof json === "object" && "data" in json ? json.data : json;
    return { status: res.status, ok: res.ok, data };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. Authentication & Multi-Role Authorization
  // ─────────────────────────────────────────────────────────────────────────────
  describe("1. Multi-Role Authentication & Session Verification", () => {
    it("should authenticate School Admin and return active session", async () => {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "admin@oakridge.edu",
          password: "Admin@123",
        }),
      });

      expect([200, 201]).toContain(res.status);
      expect(res.data.accessToken).toBeDefined();
      expect(res.data.user.role).toBe("ADMIN");
      adminToken = res.data.accessToken;
      adminUser = res.data.user;
    });

    it("should authenticate Teacher and return assigned profile", async () => {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "sarah@oakridge.edu",
          password: "Teacher@123",
        }),
      });

      expect([200, 201]).toContain(res.status);
      expect(res.data.accessToken).toBeDefined();
      expect(res.data.user.role).toBe("TEACHER");
      teacherToken = res.data.accessToken;
      teacherUser = res.data.user;
    });

    it("should authenticate Student and return linked enrollment", async () => {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "alice@oakridge.edu",
          password: "Student@123",
        }),
      });

      expect([200, 201]).toContain(res.status);
      expect(res.data.accessToken).toBeDefined();
      expect(res.data.user.role).toBe("STUDENT");
      studentToken = res.data.accessToken;
      studentUser = res.data.user;
    });

    it("should authenticate Parent and return child relations", async () => {
      const res = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email: "robert.parent@oakridge.edu",
          password: "Parent@123",
        }),
      });

      expect([200, 201]).toContain(res.status);
      expect(res.data.accessToken).toBeDefined();
      expect(res.data.user.role).toBe("PARENT");
      parentToken = res.data.accessToken;
      parentUser = res.data.user;
    });

    it("should return correct user profile via /auth/me for each role", async () => {
      const adminMe = await api("/auth/me", {}, adminToken);
      expect(adminMe.status).toBe(200);
      expect(adminMe.data.email || adminMe.data.user?.email).toBe("admin@oakridge.edu");

      const teacherMe = await api("/auth/me", {}, teacherToken);
      expect(teacherMe.status).toBe(200);
      expect(teacherMe.data.email || teacherMe.data.user?.email).toBe("sarah@oakridge.edu");
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. Academic Structure & Admin CRUD (Classes, Sections, Teachers, Students)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("2. Academic Structure & Admin Database CRUD", () => {
    it("should list classes and sections from PostgreSQL", async () => {
      const res = await api("/classes", {}, adminToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data.length).toBeGreaterThan(0);

      // Cache a class and section for subsequent tests
      const cls = res.data[0];
      activeClassId = cls.id;
      if (cls.sections && cls.sections.length > 0) {
        activeSectionId = cls.sections[0].id;
      }
    });

    it("should perform full CRUD on academic sections (Create -> Update -> Delete)", async () => {
      if (!activeClassId) return;

      // 1. Create test section
      const createRes = await api(
        "/classes/sections",
        {
          method: "POST",
          body: JSON.stringify({
            classId: activeClassId,
            name: "Z-Vitest",
            room: "Room 999",
            capacity: 30,
          }),
        },
        adminToken
      );

      expect([200, 201]).toContain(createRes.status);
      const testSectionId = createRes.data.id;
      expect(testSectionId).toBeDefined();

      // 2. Update section
      const updateRes = await api(
        `/classes/sections/${testSectionId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            room: "Room 999-Updated",
            capacity: 35,
          }),
        },
        adminToken
      );
      expect(updateRes.status).toBe(200);
      expect(updateRes.data.room).toBe("Room 999-Updated");

      // 3. Delete section
      const delRes = await api(`/classes/sections/${testSectionId}`, { method: "DELETE" }, adminToken);
      expect(delRes.status).toBe(200);

      // Verify deletion
      const classesAfter = await api("/classes", {}, adminToken);
      const cls = classesAfter.data.find((c: any) => c.id === activeClassId);
      const exists = cls?.sections?.some((s: any) => s.id === testSectionId);
      expect(exists).toBeFalsy();
    });

    it("should list teachers and find active teacher profile", async () => {
      const res = await api("/teachers", {}, adminToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      if (res.data.length > 0) {
        activeTeacherId = res.data[0].id;
      }
    });

    it("should list students and find enrolled student", async () => {
      const res = await api("/students", {}, adminToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      if (res.data.length > 0) {
        activeStudentId = res.data[0].id;
      }
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. Timetable System (Section Timetable, Class Timetable & Teacher Printing)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("3. Timetable System, Class Schedule & Teacher Slots", () => {
    let createdSlotId = "";

    it("should fetch section timetable", async () => {
      if (!activeSectionId) return;
      const res = await api(`/timetable/section/${activeSectionId}`, {}, adminToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it("should fetch class timetable (across all sections) via new endpoint", async () => {
      if (!activeClassId) return;
      const res = await api(`/timetable/class/${activeClassId}`, {}, adminToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it("should create and delete a timetable slot cleanly (CRUD)", async () => {
      if (!activeSectionId) return;

      // Create a test timetable entry
      const createRes = await api(
        "/timetable/entry",
        {
          method: "POST",
          body: JSON.stringify({
            sectionId: activeSectionId,
            dayOfWeek: "FRIDAY",
            periodNumber: 8,
            startTime: "13:30",
            endTime: "14:15",
            subjectName: "Vitest Lab Session",
            room: "Lab 404",
          }),
        },
        adminToken
      );

      expect(createRes.status).toBe(201);
      createdSlotId = createRes.data.id;
      expect(createdSlotId).toBeDefined();

      // Delete the entry
      const delRes = await api(`/timetable/entry/${createdSlotId}`, { method: "DELETE" }, adminToken);
      expect(delRes.status).toBe(200);
    });

    it("should fetch teacher timetable with className and sectionName for print views", async () => {
      if (!activeTeacherId) return;
      const res = await api(`/timetable/teacher/${activeTeacherId}`, {}, teacherToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);

      // Verify that every slot returned includes relational section and class models
      if (res.data.length > 0) {
        const slot = res.data[0];
        expect(slot.section).toBeDefined();
        expect(slot.section.class).toBeDefined();
      }
    });

    it("should allow student to query their own personal timetable", async () => {
      if (!activeStudentId) return;
      const res = await api(`/timetable/student/${activeStudentId}`, {}, studentToken);
      expect(res.status).toBe(200);
      expect(res.data.student).toBeDefined();
      expect(Array.isArray(res.data.slots)).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. Examination, Marks & Question Paper Management
  // ─────────────────────────────────────────────────────────────────────────────
  describe("4. Examinations, Question Papers (Equal Marks) & Teacher Grading", () => {
    let createdPaperId = "";

    beforeAll(async () => {
      const termsRes = await api("/marks/exam-terms", {}, adminToken);
      if (termsRes.data && termsRes.data.length > 0) {
        activeExamTermId = termsRes.data[0].id;
      }
      const classesRes = await api("/classes", {}, adminToken);
      if (classesRes.data && classesRes.data[0]?.subjects?.length > 0) {
        activeSubjectId = classesRes.data[0].subjects[0].id;
      }
    });

    it("should fetch teacher context showing assigned subjects and sections", async () => {
      const res = await api("/marks/teacher-context", {}, teacherToken);
      expect(res.status).toBe(200);
      expect(res.data.isTeacher).toBe(true);
      expect(Array.isArray(res.data.taughtSubjects)).toBe(true);
    });

    it("should allow teacher to create a question paper with verified balanced marks", async () => {
      if (!activeExamTermId || !activeClassId || !activeSubjectId) return;

      const structuredQuestions = [
        {
          sectionTitle: "Official Examination Questions",
          instructions: "Attempt all questions.",
          questions: [
            { qNumber: "1", questionText: "Core fundamentals and conceptual definitions.", marks: 25 },
            { qNumber: "2", questionText: "Numerical problem solving and application proofs.", marks: 35 },
            { qNumber: "3", questionText: "Comprehensive essay and analysis breakdown.", marks: 40 },
          ],
        },
      ];

      // Sum = 25 + 35 + 40 = 100
      const res = await api(
        "/marks/question-papers",
        {
          method: "POST",
          body: JSON.stringify({
            examTermId: activeExamTermId,
            classId: activeClassId,
            subjectId: activeSubjectId,
            title: "Vitest Comprehensive Subject Assessment",
            durationHours: 2.5,
            totalMarks: 100, // Matches sum exactly
            instructions: "1. Attempt all questions.\n2. Calculators prohibited.",
            questionsJson: JSON.stringify(structuredQuestions),
          }),
        },
        teacherToken
      );

      expect(res.status).toBe(201);
      expect(res.data.id).toBeDefined();
      expect(res.data.totalMarks).toBe(100);
      createdPaperId = res.data.id;
    });

    it("should set question paper as active official version", async () => {
      if (!createdPaperId) return;
      const res = await api(
        `/marks/question-papers/${createdPaperId}/set-active`,
        { method: "PATCH" },
        teacherToken
      );
      expect(res.status).toBe(200);
    });

    it("should fetch printable question paper for printing without auth error", async () => {
      if (!createdPaperId) return;
      const res = await api(
        `/marks/question-paper/print/${createdPaperId}`,
        {},
        teacherToken
      );
      expect(res.status).toBe(200);
      expect(res.data.title || res.data.paper?.title).toBe("Vitest Comprehensive Subject Assessment");
      expect(res.data.school).toBeDefined();
      expect(Array.isArray(res.data.sections)).toBe(true);
    });

    it("should delete question paper cleanly", async () => {
      if (!createdPaperId) return;
      const res = await api(
        `/marks/question-papers/${createdPaperId}`,
        { method: "DELETE" },
        teacherToken
      );
      expect(res.status).toBe(200);
    });

    it("should fetch marks roster and allow teacher to save marks", async () => {
      if (!activeExamTermId || !activeSectionId || !activeSubjectId) return;

      const rosterRes = await api(
        `/marks/section-marks?sectionId=${activeSectionId}&examTermId=${activeExamTermId}&subjectId=${activeSubjectId}`,
        {},
        teacherToken
      );
      expect(rosterRes.status).toBe(200);
      expect(Array.isArray(rosterRes.data)).toBe(true);

      if (rosterRes.data.length > 0) {
        const student = rosterRes.data[0];
        const saveRes = await api(
          "/marks/save",
          {
            method: "POST",
            body: JSON.stringify({
              examTermId: activeExamTermId,
              subjectId: activeSubjectId,
              entries: [
                {
                  studentId: student.studentId,
                  obtainedMarks: 88,
                  totalMarks: 100,
                  comments: "Consistent performance in Vitest suite test",
                },
              ],
            }),
          },
          teacherToken
        );

        expect(saveRes.status).toBe(201);
        expect(saveRes.data.count).toBeGreaterThan(0);
      }
    });

    it("should fetch student report card for parent and student view", async () => {
      if (!activeStudentId) return;
      const res = await api(`/marks/report-card/${activeStudentId}`, {}, studentToken);
      expect(res.status).toBe(200);
      expect(res.data.student.id).toBe(activeStudentId);
      expect(res.data.summary).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // 5. Fee Management (Student Targeted Challans & Custom Discounts)
  // ─────────────────────────────────────────────────────────────────────────────
  describe("5. Fee Management, Custom Discount & Bill Generation", () => {
    let generatedChallanId = "";

    it("should fetch list of fee challans", async () => {
      const res = await api("/fees/challans", {}, adminToken);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it("should generate a monthly fee challan with flat PKR discount for a specific student", async () => {
      if (!activeClassId || !activeSectionId || !activeStudentId) return;

      const res = await api(
        "/fees/challans/bulk",
        {
          method: "POST",
          body: JSON.stringify({
            classId: activeClassId,
            sectionId: activeSectionId,
            studentId: activeStudentId,
            title: "October Monthly Tuition Challan",
            month: "October",
            academicYear: "2026-2027",
            amount: 6000,
            dueDate: "2026-10-25T00:00:00.000Z",
            discountAmount: 1000, // PKR 1,000 discount applied
          }),
        },
        adminToken
      );

      expect([200, 201]).toContain(res.status);

      // Verify the generated challan
      const challansRes = await api(
        `/fees/challans?studentId=${activeStudentId}`,
        {},
        adminToken
      );
      expect(challansRes.status).toBe(200);
      if (Array.isArray(challansRes.data) && challansRes.data.length > 0) {
        const challan = challansRes.data[0];
        generatedChallanId = challan.id;
        // Amount should reflect the discount (6000 - 1000 = 5000)
        expect(challan.amount).toBe(5000);
      }
    });

    it("should record a partial or full payment on the fee challan", async () => {
      if (!generatedChallanId) return;

      const payRes = await api(
        `/fees/challans/${generatedChallanId}/pay`,
        {
          method: "POST",
          body: JSON.stringify({
            paidAmount: 5000,
            paymentMethod: "Bank Transfer",
          }),
        },
        adminToken
      );

      expect([200, 201]).toContain(payRes.status);
    });
  });
});
