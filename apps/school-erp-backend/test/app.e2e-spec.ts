import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('School ERP Backend — Complete All-Modules & Pages E2E Suite', () => {
  let app: INestApplication<App>;
  let adminToken: string;
  let superAdminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let testClassId: string;
  let testSectionId: string;
  let testSubjectId: string;
  let testStudentId: string;
  let testTeacherId: string;
  let testExamTermId: string;
  let createdStudentId: string;
  let createdTeacherId: string;
  let createdSectionId: string;
  let createdNotificationId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api', { exclude: ['/'] });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  }, 120000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  // 1. Health & Load Balancer Telemetry
  it('1. GET / and GET /api/health should return ok and Read-Replica Load Balancer status', async () => {
    await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');

    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.databaseLoadBalancer).toBeDefined();
    expect(res.body.databaseLoadBalancer.strategy).toBe('ROUND_ROBIN_READ_REPLICA');
    expect(res.body.databaseLoadBalancer.readReplicaCount).toBeGreaterThanOrEqual(2);
  });

  // 2. Database Demo Seeding
  it('2. POST /api/seed/demo should seed all multi-tenant roles, classes, students, teachers, marks & fees', async () => {
    const res = await request(app.getHttpServer()).post('/api/seed/demo').expect(201);
    expect(res.body.success).toBe(true);
    expect(res.body.credentials.admin.email).toBe('admin@oakridge.edu');
  }, 60000);

  // 3. Multi-Role Authentication (Admin, SuperAdmin, Teacher, Student)
  it('3. POST /api/auth/login should authenticate Admin, SuperAdmin, Teacher, and Student accounts', async () => {
    const adminRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@oakridge.edu', password: 'Admin@123', rememberDevice: true })
      .expect(201);
    adminToken = adminRes.body.token;
    expect(adminToken).toBeDefined();

    const superRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'superadmin@academix.com', password: 'SuperAdmin@123' })
      .expect(201);
    superAdminToken = superRes.body.token;
    expect(superAdminToken).toBeDefined();

    const teacherRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'sarah@oakridge.edu', password: 'Teacher@123' })
      .expect(201);
    teacherToken = teacherRes.body.token;
    expect(teacherToken).toBeDefined();

    const studentRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'alice@oakridge.edu', password: 'Student@123' })
      .expect(201);
    studentToken = studentRes.body.token;
    expect(studentToken).toBeDefined();
  });

  // 4. Auth Profile, Theme Switcher & Account Settings Page APIs
  it('4. GET /api/auth/me, PATCH /api/auth/theme & PATCH /api/users/profile should work without leaking secrets', async () => {
    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(meRes.body.email).toBe('admin@oakridge.edu');
    expect(meRes.body.passwordHash).toBeUndefined();
    expect(meRes.body.twoFactorSecret).toBeUndefined();

    const themeRes = await request(app.getHttpServer())
      .patch('/api/auth/theme')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ themeColor: '#0D9488' })
      .expect(200);
    expect(themeRes.body.themeColor).toBe('#0D9488');

    const profileRes = await request(app.getHttpServer())
      .patch('/api/users/profile')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Arthur Pendelton (Principal)', phone: '+1 (555) 019-2834' })
      .expect(200);
    expect(profileRes.body.name).toContain('Arthur Pendelton');
  });

  // 5. All Role Dashboards (Admin, SuperAdmin, Teacher, Student)
  it('5. GET /api/dashboard/{admin,superadmin,teacher,student} should serve all 4 role dashboard pages', async () => {
    const adminDash = await request(app.getHttpServer())
      .get('/api/dashboard/admin?fresh=true')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminDash.body.studentCount).toBeGreaterThan(0);
    expect(adminDash.body.dbLoadBalancer).toBeDefined();
    expect(adminDash.body.recentAdmissions[0].guardianName).toBeDefined();

    const superDash = await request(app.getHttpServer())
      .get('/api/dashboard/superadmin')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);
    expect(superDash.body.totalSchools).toBeGreaterThanOrEqual(1);

    const teacherDash = await request(app.getHttpServer())
      .get('/api/dashboard/teacher')
      .set('Authorization', `Bearer ${teacherToken}`)
      .expect(200);
    expect(teacherDash.body.teacher).toBeDefined();

    const studentDash = await request(app.getHttpServer())
      .get('/api/dashboard/student')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);
    expect(studentDash.body.fullName).toBe('Alice Brown');
  });

  // 6. Schools, Registration Requests & Branding Settings Page APIs
  it('6. GET /api/schools/current, PATCH /api/schools/current & GET /api/schools/superadmin/pending-requests should work', async () => {
    const mySchool = await request(app.getHttpServer())
      .get('/api/schools/current')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(mySchool.body.code).toBe('OAK-RIDGE');

    const updatedSchool = await request(app.getHttpServer())
      .patch('/api/schools/current')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ primaryColor: '#0D9488' })
      .expect(200);
    expect(updatedSchool.body.primaryColor).toBe('#0D9488');

    const requestsRes = await request(app.getHttpServer())
      .get('/api/schools/superadmin/pending-requests')
      .set('Authorization', `Bearer ${superAdminToken}`)
      .expect(200);
    expect(Array.isArray(requestsRes.body)).toBe(true);
  });

  // 7. Classes, Sections & Subjects Manager Page APIs
  it('7. GET /api/classes, POST/PATCH/DELETE sections & GET /api/classes/subjects should work', async () => {
    const classesRes = await request(app.getHttpServer())
      .get('/api/classes')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(classesRes.body.length).toBeGreaterThan(0);
    expect(classesRes.body[0].numericGrade).toBeDefined();
    const grade10 = classesRes.body.find((c: any) => c.grade === 10) || classesRes.body[0];
    testClassId = grade10.id;
    testSectionId = grade10.sections[0].id;

    // Create & delete a temporary section
    const secCreate = await request(app.getHttpServer())
      .post('/api/classes/sections')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ classId: testClassId, name: 'Z-Test', roomNumber: 'Room 999', capacity: 30 })
      .expect(201);
    createdSectionId = secCreate.body.id;

    await request(app.getHttpServer())
      .patch(`/api/classes/sections/${createdSectionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ roomNumber: 'Room 998' })
      .expect(200);

    await request(app.getHttpServer())
      .delete(`/api/classes/sections/${createdSectionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const subjectsRes = await request(app.getHttpServer())
      .get('/api/classes/subjects')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(subjectsRes.body.length).toBeGreaterThan(0);
    testSubjectId = subjectsRes.body[0].id;
  });

  // 8. Students Directory & Academic Progression Page APIs
  it('8. GET/POST/PATCH/DELETE /api/students & promote/demote should support full student lifecycle', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(listRes.body.length).toBeGreaterThan(0);
    expect(listRes.body[0].firstName).toBeDefined();
    testStudentId = listRes.body[0].id;

    const createRes = await request(app.getHttpServer())
      .post('/api/students')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Zayan',
        lastName: 'Testing',
        rollNumber: '99',
        classId: testClassId,
        sectionId: testSectionId,
        gender: 'male',
        guardianName: 'Tariq Testing',
        guardianPhone: '+92-300-1112233',
        guardianEmail: 'tariq.e2e@oakridge.edu',
        discountPercentage: 10,
      })
      .expect(201);
    createdStudentId = createRes.body.id;
    expect(createRes.body.fullName).toBe('Zayan Testing');

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Zayan', lastName: 'Updated', guardianName: 'Tariq Updated', status: 'inactive' })
      .expect(200);
    expect(patchRes.body.fullName).toBe('Zayan Updated');
    expect(patchRes.body.status).toBe('inactive');

    await request(app.getHttpServer())
      .delete(`/api/students/${createdStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  // 9. Teachers Directory Page APIs
  it('9. GET/POST/PATCH/DELETE /api/teachers should support full faculty lifecycle', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/api/teachers')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(listRes.body.length).toBeGreaterThan(0);
    testTeacherId = listRes.body[0].id;

    const uniqueEmail = `teacher.e2e.${Date.now()}@oakridge.edu`;
    const createRes = await request(app.getHttpServer())
      .post('/api/teachers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        firstName: 'Omar',
        lastName: 'Farooq',
        email: uniqueEmail,
        phone: '+1-555-7788',
        department: 'Computer Science',
        qualification: 'M.Sc. CS',
      })
      .expect(201);
    createdTeacherId = createRes.body.id;
    expect(createRes.body.fullName).toBe('Omar Farooq');

    const patchRes = await request(app.getHttpServer())
      .patch(`/api/teachers/${createdTeacherId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'inactive', department: 'AI & Robotics' })
      .expect(200);
    expect(patchRes.body.specialization).toBe('AI & Robotics');

    await request(app.getHttpServer())
      .delete(`/api/teachers/${createdTeacherId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  // 10. Attendance Sheet & Student Attendance Page APIs
  it('10. GET /api/attendance, POST /api/attendance/bulk & GET /api/attendance/student/:id should work', async () => {
    const today = new Date().toISOString().split('T')[0];
    const getRes = await request(app.getHttpServer())
      .get(`/api/attendance?sectionId=${testSectionId}&date=${today}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(getRes.body)).toBe(true);

    if (getRes.body.length > 0) {
      const bulkRes = await request(app.getHttpServer())
        .post('/api/attendance/bulk')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sectionId: testSectionId,
          date: today,
          records: [{ studentId: getRes.body[0].studentId, status: 'PRESENT', remarks: 'On time' }],
        })
        .expect(201);
      expect(bulkRes.body.success).toBe(true);
    }

    const stuAtt = await request(app.getHttpServer())
      .get(`/api/attendance/student/${testStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(stuAtt.body.summary).toBeDefined();

    // 10b. Teacher Daily Self-Attendance (Photo + Live GPS Geofence) & Leave Approval Workflow
    await request(app.getHttpServer())
      .patch('/api/attendance/teacher/school-location')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ latitude: 31.5204, longitude: 74.3587, geofenceRadiusMeters: 250 })
      .expect(200);

    // Off-campus GPS check-in (~3.5km away) MUST fail with 400 Bad Request (location mismatch)
    const offCampusRes = await request(app.getHttpServer())
      .post('/api/attendance/teacher/check-in')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        latitude: 31.5520,
        longitude: 74.3910,
      })
      .expect(400);
    expect(JSON.stringify(offCampusRes.body)).toMatch(/Location mismatch/i);

    // On-campus GPS check-in (~14m from school center) MUST succeed with locationVerified: true & automatic status: PRESENT
    const onCampusRes = await request(app.getHttpServer())
      .post('/api/attendance/teacher/check-in')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        latitude: 31.5205,
        longitude: 74.3588,
        remarks: 'Arrived at Main Campus Gate',
      })
      .expect(201);
    expect(onCampusRes.body.locationVerified).toBe(true);
    expect(onCampusRes.body.status).toBe('PRESENT');

    // Verify 3-day automatic image retention cleanup endpoint
    const purgeRes = await request(app.getHttpServer())
      .post('/api/attendance/teacher/purge-old-photos')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(201);
    expect(purgeRes.body.retentionDays).toBe(3);

    // Verify Mobile QR Code Live GPS Session creation & mobile submission (no JWT required on mobile scan)
    const qrSessionRes = await request(app.getHttpServer())
      .post('/api/attendance/teacher/qr-session')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ purpose: 'TEACHER_CHECK_IN' })
      .expect(201);
    expect(qrSessionRes.body.sessionId).toBeDefined();

    const qrPollRes = await request(app.getHttpServer())
      .get(`/api/attendance/teacher/qr-session/${qrSessionRes.body.sessionId}`)
      .expect(200);
    expect(qrPollRes.body.status).toBe('PENDING');

    const qrSubmitRes = await request(app.getHttpServer())
      .post(`/api/attendance/teacher/qr-session/${qrSessionRes.body.sessionId}/submit`)
      .send({
        latitude: 31.5204,
        longitude: 74.3587,
        photoUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        remarks: 'Mobile QR GPS Check-In',
      })
      .expect(201);
    expect(qrSubmitRes.body.status).toBe('COMPLETED');
    expect(qrSubmitRes.body.result.status).toBe('PRESENT');

    // Teacher applies for leave -> School Admin approves it
    const leaveRes = await request(app.getHttpServer())
      .post('/api/attendance/teacher/leaves')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        leaveType: 'CASUAL',
        startDate: '2026-11-15',
        endDate: '2026-11-16',
        reason: 'Academic conference attendance',
      })
      .expect(201);
    expect(leaveRes.body.status).toBe('PENDING');

    const approvedLeave = await request(app.getHttpServer())
      .patch(`/api/attendance/teacher/leaves/${leaveRes.body.id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'APPROVED', adminRemarks: 'Approved for academic conference' })
      .expect(200);
    expect(approvedLeave.body.status).toBe('APPROVED');

    // Admin fetches daily teacher attendance records
    const adminTeacherAtt = await request(app.getHttpServer())
      .get(`/api/attendance/teacher/records?date=${today}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(adminTeacherAtt.body.summary).toBeDefined();
    expect(Array.isArray(adminTeacherAtt.body.records)).toBe(true);
  });

  // 11. Examinations, Marks Entry, Report Card, Date Sheet & Question Papers Page APIs
  it('11. GET /api/marks/exam-terms, section-marks, save, report-card, paper-schedules & question-papers should work', async () => {
    const termsRes = await request(app.getHttpServer())
      .get('/api/marks/exam-terms')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(termsRes.body.length).toBeGreaterThan(0);
    testExamTermId = termsRes.body[0].id;

    const sheetRes = await request(app.getHttpServer())
      .get(`/api/marks/section-marks?examTermId=${testExamTermId}&sectionId=${testSectionId}&subjectId=${testSubjectId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(sheetRes.body)).toBe(true);

    if (sheetRes.body.length > 0) {
      const saveRes = await request(app.getHttpServer())
        .post('/api/marks/save')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          examTermId: testExamTermId,
          subjectId: testSubjectId,
          entries: [
            {
              studentId: sheetRes.body[0].studentId,
              obtainedMarks: 92,
              totalMarks: 100,
              grade: 'A+',
              comments: 'Excellent work',
            },
          ],
        })
        .expect(201);
      expect(saveRes.body.success).toBe(true);
    }

    const reportCard = await request(app.getHttpServer())
      .get(`/api/marks/report-card/${testStudentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(reportCard.body.student).toBeDefined();

    await request(app.getHttpServer())
      .get(`/api/marks/paper-schedules?examTermId=${testExamTermId}&classId=${testClassId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/marks/question-papers?examTermId=${testExamTermId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
  });

  // 12. Fees, Structures, Challans, Late Fee Policy & Student Ledger Page APIs
  it('12. GET/POST /api/fees/structures, challans, late-fee-policy & student ledger should work', async () => {
    const structRes = await request(app.getHttpServer())
      .get('/api/fees/structures')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(structRes.body)).toBe(true);

    // Admin sets Late Fee Increment after due date to 750
    const policyRes = await request(app.getHttpServer())
      .patch('/api/fees/late-fee-policy')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ lateFeeAmount: 750 })
      .expect(200);
    expect(policyRes.body.lateFeeAmount).toBe(750);

    // Create a past-due challan and verify automatic OVERDUE status + lateFeeApplied + payableAfterDueDate
    const pastDueRes = await request(app.getHttpServer())
      .post('/api/fees/challans')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId: testStudentId,
        title: 'Past Due Tuition Fee',
        month: 'September',
        academicYear: '2026-2027',
        dueDate: '2025-01-10',
        amount: 5000,
      })
      .expect(201);
    expect(pastDueRes.body.isPastDue).toBe(true);
    expect(pastDueRes.body.lateFeeAmount).toBe(750);
    expect(pastDueRes.body.payableAfterDueDate).toBeGreaterThan(pastDueRes.body.baseAmount);

    const challanRes = await request(app.getHttpServer())
      .get(`/api/fees/challans?sectionId=${testSectionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(challanRes.body)).toBe(true);

    const ledgerRes = await request(app.getHttpServer())
      .get(`/api/fees/student/${testStudentId}/ledger`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(ledgerRes.body.summary).toBeDefined();
  });

  // 13. Timetable Page APIs
  it('13. GET /api/timetable/section/:id and GET /api/timetable/teacher/:id should work', async () => {
    const secTt = await request(app.getHttpServer())
      .get(`/api/timetable/section/${testSectionId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(secTt.body)).toBe(true);

    const teacherTt = await request(app.getHttpServer())
      .get(`/api/timetable/teacher/${testTeacherId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(teacherTt.body)).toBe(true);
  });

  // 14. Notifications & Audit Logs Page APIs
  it('14. POST /api/notifications/broadcast, GET /api/notifications, PATCH read & GET /api/audit/logs should work', async () => {
    const broadcastRes = await request(app.getHttpServer())
      .post('/api/notifications/broadcast')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'E2E Test Broadcast',
        body: 'Testing notification broadcast from E2E suite',
        audienceRole: 'ALL',
        kind: 'info',
      })
      .expect(201);

    createdNotificationId = (broadcastRes.body._id || broadcastRes.body.id).toString();
    expect(createdNotificationId).toBeDefined();

    const listRes = await request(app.getHttpServer())
      .get('/api/notifications')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(listRes.body)).toBe(true);

    const readRes = await request(app.getHttpServer())
      .patch(`/api/notifications/${createdNotificationId}/read`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(readRes.body.success).toBe(true);

    const auditRes = await request(app.getHttpServer())
      .get('/api/audit/logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(auditRes.body)).toBe(true);
  });
});
