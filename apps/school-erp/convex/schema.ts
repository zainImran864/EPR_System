import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Multi-Tenant Schools ──────────────────────────────────────────
  schools: defineTable({
    name: v.string(),
    code: v.string(), // e.g. "OAK-RIDGE"
    logoUrl: v.optional(v.string()),
    primaryColor: v.optional(v.string()), // e.g. "#0D9488"
    customDomain: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    address: v.optional(v.string()),
    activeYear: v.string(), // e.g. "2026-2027"
    // Per-school SMTP (credential emails to teachers/students are sent from here)
    smtpHost: v.optional(v.string()),
    smtpPort: v.optional(v.number()),
    smtpUser: v.optional(v.string()),
    smtpPass: v.optional(v.string()),
    smtpFrom: v.optional(v.string()),
    smtpSecure: v.optional(v.boolean()),
    smtpEnabled: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_customDomain", ["customDomain"]),

  // ─── Users & Roles (custom DB auth) ───────────────────────────────
  users: defineTable({
    schoolId: v.optional(v.id("schools")), // undefined for platform superadmin
    name: v.string(),
    email: v.string(), // login identifier — unique per deployment
    role: v.union(
      v.literal("superadmin"),
      v.literal("admin"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("student")
    ),
    passwordHash: v.string(),
    passwordSalt: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("active"),
      v.literal("inactive")
    ),
    avatarUrl: v.optional(v.string()),
    phone: v.optional(v.string()),
    linkedTeacherId: v.optional(v.id("teachers")),
    linkedStudentId: v.optional(v.id("students")),
    mustChangePassword: v.optional(v.boolean()),
    // Per-user settings
    twoFactorEnabled: v.optional(v.boolean()),
    twoFactorSecret: v.optional(v.string()),
    notificationsEnabled: v.optional(v.boolean()),
    notificationsClearedAt: v.optional(v.number()), // hide notifications before this
    themeColor: v.optional(v.string()), // per-user sidebar accent (hex)
    createdAt: v.number(),
  })
    .index("by_schoolId", ["schoolId"])
    .index("by_email", ["email"])
    .index("by_schoolId_and_role", ["schoolId", "role"]),

  // ─── Sessions (login tokens) ──────────────────────────────────────
  sessions: defineTable({
    userId: v.id("users"),
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
    // True while a 2FA-enabled login is awaiting its TOTP code (not usable yet).
    pending2fa: v.optional(v.boolean()),
  })
    .index("by_token", ["token"])
    .index("by_userId", ["userId"]),

  // ─── Trusted devices (skip 2FA on a remembered browser) ───────────
  trustedDevices: defineTable({
    userId: v.id("users"),
    deviceToken: v.string(), // random, stored in the browser's localStorage
    label: v.string(), // e.g. "Chrome on Windows"
    createdAt: v.number(),
    lastUsedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_deviceToken", ["deviceToken"]),

  // ─── School Registration Requests (super-admin approval queue) ────
  registrationRequests: defineTable({
    schoolName: v.string(),
    schoolSlug: v.string(), // e.g. "oakridge" → used for @slug.com emails
    address: v.optional(v.string()),
    phone: v.optional(v.string()),
    contactEmail: v.string(), // real inbox of the registrant
    classesOffered: v.array(v.number()), // e.g. [1,2,...,10]
    totalTeachers: v.optional(v.number()),
    totalStudents: v.optional(v.number()),
    adminName: v.string(),
    adminEmail: v.string(), // generated: admin@slug.com
    adminPasswordHash: v.string(),
    adminPasswordSalt: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    reviewNote: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  // ─── Academic Classes & Sections ─────────────────────────────────
  classes: defineTable({
    schoolId: v.id("schools"),
    name: v.string(), // e.g. "Grade 10" or "Class 10"
    numericGrade: v.number(), // e.g. 10
    academicYear: v.string(), // e.g. "2026-2027"
  })
    .index("by_schoolId", ["schoolId"])
    .index("by_schoolId_and_grade", ["schoolId", "numericGrade"]),

  sections: defineTable({
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    name: v.string(), // e.g. "Section A"
    roomNumber: v.optional(v.string()),
    classTeacherId: v.optional(v.id("teachers")),
  })
    .index("by_schoolId", ["schoolId"])
    .index("by_classId", ["classId"])
    .index("by_schoolId_and_classId", ["schoolId", "classId"]),

  // ─── Subjects Catalog ────────────────────────────────────────────
  subjects: defineTable({
    schoolId: v.id("schools"),
    name: v.string(), // e.g. "Mathematics"
    code: v.string(), // e.g. "MATH-10"
    creditHours: v.optional(v.number()),
  }).index("by_schoolId", ["schoolId"]),

  classSubjects: defineTable({
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    subjectId: v.id("subjects"),
    teacherId: v.optional(v.id("teachers")),
  })
    .index("by_schoolId", ["schoolId"])
    .index("by_sectionId", ["sectionId"]),

  // ─── Teachers ────────────────────────────────────────────────────
  teachers: defineTable({
    schoolId: v.id("schools"),
    userId: v.optional(v.id("users")),
    firstName: v.string(),
    lastName: v.string(),
    employeeId: v.string(), // e.g. "TCH-1001"
    email: v.string(),
    phone: v.optional(v.string()),
    designation: v.string(), // e.g. "Senior Science Faculty"
    department: v.string(), // e.g. "Science"
    joinDate: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("inactive")),
  })
    .index("by_schoolId", ["schoolId"])
    .index("by_employeeId", ["schoolId", "employeeId"]),

  // ─── Students ────────────────────────────────────────────────────
  students: defineTable({
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    firstName: v.string(),
    lastName: v.string(),
    admissionNumber: v.string(), // e.g. "ADM-2026-089"
    rollNumber: v.string(), // e.g. "10-A-01"
    dob: v.optional(v.string()),
    gender: v.union(v.literal("male"), v.literal("female"), v.literal("other")),
    bloodGroup: v.optional(v.string()),
    guardianName: v.string(),
    guardianPhone: v.string(),
    guardianEmail: v.optional(v.string()),
    address: v.optional(v.string()),
    linkedParentUserId: v.optional(v.id("users")),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("transferred")),
    enrollmentDate: v.string(),
  })
    .index("by_schoolId", ["schoolId"])
    .index("by_schoolId_and_classId", ["schoolId", "classId"])
    .index("by_schoolId_and_sectionId", ["schoolId", "sectionId"])
    .index("by_admissionNumber", ["schoolId", "admissionNumber"]),

  // ─── Attendance ──────────────────────────────────────────────────
  attendance: defineTable({
    schoolId: v.id("schools"),
    date: v.string(), // "YYYY-MM-DD" format
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    studentId: v.id("students"),
    status: v.union(
      v.literal("present"),
      v.literal("absent"),
      v.literal("late"),
      v.literal("excused")
    ),
    remarks: v.optional(v.string()),
    recordedBy: v.optional(v.string()),
  })
    .index("by_schoolId_and_date", ["schoolId", "date"])
    .index("by_section_and_date", ["schoolId", "classId", "sectionId", "date"])
    .index("by_student_and_date", ["schoolId", "studentId", "date"]),

  // ─── Exams & Marks ───────────────────────────────────────────────
  exams: defineTable({
    schoolId: v.id("schools"),
    name: v.string(), // e.g. "Mid-Term Examination 2026"
    term: v.string(), // e.g. "Term 1"
    startDate: v.string(),
    endDate: v.string(),
    academicYear: v.string(),
    isPublished: v.boolean(),
  }).index("by_schoolId", ["schoolId"]),

  marks: defineTable({
    schoolId: v.id("schools"),
    examId: v.id("exams"),
    studentId: v.id("students"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    subjectId: v.id("subjects"),
    totalMarks: v.number(), // e.g. 100
    obtainedMarks: v.number(), // e.g. 88
    grade: v.string(), // e.g. "A+"
    remarks: v.optional(v.string()),
  })
    .index("by_school_exam_student", ["schoolId", "examId", "studentId"])
    .index("by_school_exam_subject", ["schoolId", "examId", "subjectId"])
    .index("by_school_exam_section", ["schoolId", "examId", "classId", "sectionId"]),

  // ─── Timetable ───────────────────────────────────────────────────
  timetableSlots: defineTable({
    schoolId: v.id("schools"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    dayOfWeek: v.number(), // 1 = Monday … 7 = Sunday
    period: v.number(), // 1-based period index
    startTime: v.string(), // "08:00"
    endTime: v.string(), // "08:45"
    subjectId: v.optional(v.id("subjects")),
    subjectName: v.string(), // denormalized for quick display
    teacherId: v.optional(v.id("teachers")),
    teacherName: v.optional(v.string()),
    room: v.optional(v.string()),
  })
    .index("by_schoolId", ["schoolId"])
    .index("by_section", ["schoolId", "classId", "sectionId"])
    .index("by_teacher", ["schoolId", "teacherId"]),

  // ─── Fees ────────────────────────────────────────────────────────
  feeBills: defineTable({
    schoolId: v.id("schools"),
    studentId: v.id("students"),
    classId: v.id("classes"),
    sectionId: v.id("sections"),
    title: v.string(), // e.g. "Term 1 Fees 2026"
    heads: v.array(v.object({ name: v.string(), amount: v.number() })),
    totalAmount: v.number(),
    paidAmount: v.number(),
    issueDate: v.string(),
    dueDate: v.string(),
    status: v.union(
      v.literal("unpaid"),
      v.literal("partial"),
      v.literal("paid")
    ),
    createdAt: v.number(),
  })
    .index("by_schoolId", ["schoolId"])
    .index("by_student", ["schoolId", "studentId"])
    .index("by_section", ["schoolId", "classId", "sectionId"]),

  // ─── Notifications ───────────────────────────────────────────────
  notifications: defineTable({
    schoolId: v.optional(v.id("schools")),
    title: v.string(),
    body: v.string(),
    // Targeting
    audienceRole: v.optional(
      v.union(
        v.literal("all"),
        v.literal("admin"),
        v.literal("teacher"),
        v.literal("student"),
        v.literal("parent")
      )
    ),
    targetUserId: v.optional(v.id("users")),
    kind: v.union(
      v.literal("info"),
      v.literal("success"),
      v.literal("warning"),
      v.literal("announcement")
    ),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
  })
    .index("by_schoolId", ["schoolId"])
    .index("by_targetUser", ["targetUserId"]),

  // Per-user read receipts (so unread badge is per recipient)
  notificationReads: defineTable({
    userId: v.id("users"),
    notificationId: v.id("notifications"),
    readAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_notification", ["userId", "notificationId"]),

  // ─── School change requests (name changes need super-admin approval) ─
  schoolChangeRequests: defineTable({
    schoolId: v.id("schools"),
    requestedBy: v.id("users"),
    field: v.literal("name"),
    currentValue: v.string(),
    requestedValue: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    ),
    createdAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_schoolId", ["schoolId"]),
});
