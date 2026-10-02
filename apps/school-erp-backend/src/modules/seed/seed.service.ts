import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Role, UserStatus, DayOfWeek, AttendanceStatus, FeeStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  async seedAll() {
    this.logger.log('Starting full database seed with realistic school demo data...');

    const superAdminPassword = await bcrypt.hash('SuperAdmin@123', 10);
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const teacherPassword = await bcrypt.hash('Teacher@123', 10);
    const studentPassword = await bcrypt.hash('Student@123', 10);
    const parentPassword = await bcrypt.hash('Parent@123', 10);

    // 1. Seed SuperAdmin
    const superAdmin = await this.prisma.user.upsert({
      where: { email: 'superadmin@academix.com' },
      update: {},
      create: {
        name: 'Platform Super Admin',
        email: 'superadmin@academix.com',
        role: Role.SUPERADMIN,
        passwordHash: superAdminPassword,
        status: UserStatus.ACTIVE,
        themeColor: '#0D9488',
      },
    });

    // 2. Seed Oakridge International School
    const school = await this.prisma.school.upsert({
      where: { code: 'OAK-RIDGE' },
      update: {},
      create: {
        name: 'Oakridge International School',
        code: 'OAK-RIDGE',
        primaryColor: '#0D9488',
        email: 'info@oakridge.edu',
        phone: '+1 (555) 234-5678',
        address: '742 Evergreen Terrace, Springfield',
        activeYear: '2026-2027',
      },
    });

    // 3. Seed School Admin
    const schoolAdmin = await this.prisma.user.upsert({
      where: { email: 'admin@oakridge.edu' },
      update: { schoolId: school.id },
      create: {
        schoolId: school.id,
        name: 'Arthur Pendelton (Principal)',
        email: 'admin@oakridge.edu',
        role: Role.ADMIN,
        passwordHash: adminPassword,
        status: UserStatus.ACTIVE,
        phone: '+1 (555) 019-2834',
        themeColor: '#0D9488',
      },
    });

    // 4. Seed Classes & Sections (Grades 1 to 10)
    const classMap: Record<number, any> = {};
    const sectionMap: Record<string, any> = {};

    for (let grade = 1; grade <= 10; grade++) {
      const cls = await this.prisma.class.upsert({
        where: { schoolId_grade: { schoolId: school.id, grade } },
        update: {},
        create: {
          schoolId: school.id,
          grade,
          name: `Grade ${grade}`,
        },
      });
      classMap[grade] = cls;

      for (const sName of ['A', 'B']) {
        let sec = await this.prisma.section.findFirst({
          where: { classId: cls.id, name: sName },
        });
        if (!sec) {
          sec = await this.prisma.section.create({
            data: {
              classId: cls.id,
              schoolId: school.id,
              name: sName,
              capacity: 35,
              room: `Room ${grade}0${sName === 'A' ? '1' : '2'}`,
            },
          });
        }
        sectionMap[`${grade}-${sName}`] = sec;
      }
    }

    // 5. Seed Core Subjects
    const subjectNames = [
      { name: 'Mathematics', code: 'MATH' },
      { name: 'Physics', code: 'PHYS' },
      { name: 'Chemistry', code: 'CHEM' },
      { name: 'English Literature', code: 'ENG' },
      { name: 'Computer Science', code: 'CS' },
      { name: 'Biology', code: 'BIO' },
      { name: 'History & Civics', code: 'HIST' },
    ];

    const subjectMap: Record<string, any> = {};
    for (const sub of subjectNames) {
      const createdSub = await this.prisma.subject.upsert({
        where: {
          schoolId_name_classId: {
            schoolId: school.id,
            name: sub.name,
            classId: classMap[10].id,
          },
        },
        update: {},
        create: {
          schoolId: school.id,
          classId: classMap[10].id,
          name: sub.name,
          code: sub.code,
        },
      });
      subjectMap[sub.code] = createdSub;
    }

    // 6. Seed Teachers
    const teacherData = [
      {
        fullName: 'Dr. Sarah Johnson',
        email: 'sarah@oakridge.edu',
        qualification: 'Ph.D. in Mathematics, Stanford',
        designation: 'Head of Mathematics',
        specialization: 'Advanced Calculus & Algebra',
        phone: '+1 (555) 441-2231',
        empId: 'EMP-001',
      },
      {
        fullName: 'Michael Smith',
        email: 'michael@oakridge.edu',
        qualification: 'M.Sc. Physics, MIT',
        designation: 'Senior Physics Teacher',
        specialization: 'Quantum Mechanics & Optics',
        phone: '+1 (555) 441-2232',
        empId: 'EMP-002',
      },
      {
        fullName: 'Emily Davis',
        email: 'emily@oakridge.edu',
        qualification: 'M.A. English, Oxford',
        designation: 'English Faculty',
        specialization: 'World Literature & Rhetoric',
        phone: '+1 (555) 441-2233',
        empId: 'EMP-003',
      },
      {
        fullName: 'David Wilson',
        email: 'david@oakridge.edu',
        qualification: 'B.S. Computer Science, CMU',
        designation: 'IT & Computing Lead',
        specialization: 'Data Structures & Web Tech',
        phone: '+1 (555) 441-2234',
        empId: 'EMP-004',
      },
    ];

    const teacherMap: Record<string, any> = {};
    for (const t of teacherData) {
      const user = await this.prisma.user.upsert({
        where: { email: t.email },
        update: { schoolId: school.id },
        create: {
          schoolId: school.id,
          name: t.fullName,
          email: t.email,
          role: Role.TEACHER,
          passwordHash: teacherPassword,
          status: UserStatus.ACTIVE,
          phone: t.phone,
        },
      });

      const teacher = await this.prisma.teacher.upsert({
        where: { schoolId_employeeId: { schoolId: school.id, employeeId: t.empId } },
        update: {},
        create: {
          schoolId: school.id,
          userId: user.id,
          employeeId: t.empId,
          fullName: t.fullName,
          email: t.email,
          phone: t.phone,
          qualification: t.qualification,
          designation: t.designation,
          specialization: t.specialization,
        },
      });
      teacherMap[t.empId] = teacher;
    }

    // 7. Seed Students and Parents
    const studentData = [
      {
        fullName: 'Alice Brown',
        email: 'alice@oakridge.edu',
        admNo: 'ADM-2026-001',
        roll: '101',
        grade: 10,
        section: 'A',
        parentName: 'Robert Brown',
        parentEmail: 'robert.parent@oakridge.edu',
        parentPhone: '+1 (555) 901-1122',
        gender: 'Female',
      },
      {
        fullName: 'Bob Miller',
        email: 'bob@oakridge.edu',
        admNo: 'ADM-2026-002',
        roll: '102',
        grade: 10,
        section: 'A',
        parentName: 'Mary Miller',
        parentEmail: 'mary.parent@oakridge.edu',
        parentPhone: '+1 (555) 901-3344',
        gender: 'Male',
      },
      {
        fullName: 'Charlie Clark',
        email: 'charlie@oakridge.edu',
        admNo: 'ADM-2026-003',
        roll: '103',
        grade: 9,
        section: 'A',
        parentName: 'James Clark',
        parentEmail: 'james.parent@oakridge.edu',
        parentPhone: '+1 (555) 901-5566',
        gender: 'Male',
      },
      {
        fullName: 'Diana Prince',
        email: 'diana@oakridge.edu',
        admNo: 'ADM-2026-004',
        roll: '104',
        grade: 9,
        section: 'B',
        parentName: 'Thomas Prince',
        parentEmail: 'thomas.parent@oakridge.edu',
        parentPhone: '+1 (555) 901-7788',
        gender: 'Female',
      },
    ];

    const studentMap: Record<string, any> = {};
    for (const s of studentData) {
      // Parent User & Profile
      const pUser = await this.prisma.user.upsert({
        where: { email: s.parentEmail },
        update: { schoolId: school.id },
        create: {
          schoolId: school.id,
          name: s.parentName,
          email: s.parentEmail,
          role: Role.PARENT,
          passwordHash: parentPassword,
          status: UserStatus.ACTIVE,
          phone: s.parentPhone,
        },
      });

      const parent = await this.prisma.parent.upsert({
        where: { userId: pUser.id },
        update: {},
        create: {
          userId: pUser.id,
          fullName: s.parentName,
          email: s.parentEmail,
          phone: s.parentPhone,
        },
      });

      // Student User & Profile
      const sUser = await this.prisma.user.upsert({
        where: { email: s.email },
        update: { schoolId: school.id },
        create: {
          schoolId: school.id,
          name: s.fullName,
          email: s.email,
          role: Role.STUDENT,
          passwordHash: studentPassword,
          status: UserStatus.ACTIVE,
        },
      });

      const sec = sectionMap[`${s.grade}-${s.section}`];
      const student = await this.prisma.student.upsert({
        where: { schoolId_admissionNumber: { schoolId: school.id, admissionNumber: s.admNo } },
        update: {},
        create: {
          schoolId: school.id,
          userId: sUser.id,
          admissionNumber: s.admNo,
          fullName: s.fullName,
          email: s.email,
          classId: classMap[s.grade].id,
          sectionId: sec.id,
          rollNumber: s.roll,
          gender: s.gender,
          parentId: parent.id,
          status: 'active',
        },
      });
      studentMap[s.admNo] = student;
    }

    // 8. Seed Timetable Entries (Grade 10-A)
    const grade10A = sectionMap['10-A'];
    if (grade10A && subjectMap['MATH'] && teacherMap['EMP-001']) {
      const scheduleDays: DayOfWeek[] = [
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
      ];

      for (const day of scheduleDays) {
        await this.prisma.timetableEntry.upsert({
          where: {
            sectionId_dayOfWeek_periodNumber: {
              sectionId: grade10A.id,
              dayOfWeek: day,
              periodNumber: 1,
            },
          },
          update: {},
          create: {
            schoolId: school.id,
            sectionId: grade10A.id,
            subjectId: subjectMap['MATH'].id,
            teacherId: teacherMap['EMP-001'].id,
            dayOfWeek: day,
            periodNumber: 1,
            startTime: '08:30',
            endTime: '09:15',
            room: 'Lab 101',
          },
        });

        if (subjectMap['PHYS'] && teacherMap['EMP-002']) {
          await this.prisma.timetableEntry.upsert({
            where: {
              sectionId_dayOfWeek_periodNumber: {
                sectionId: grade10A.id,
                dayOfWeek: day,
                periodNumber: 2,
              },
            },
            update: {},
            create: {
              schoolId: school.id,
              sectionId: grade10A.id,
              subjectId: subjectMap['PHYS'].id,
              teacherId: teacherMap['EMP-002'].id,
              dayOfWeek: day,
              periodNumber: 2,
              startTime: '09:20',
              endTime: '10:05',
              room: 'Physics Lab',
            },
          });
        }
      }
    }

    // 9. Seed Attendance for today & yesterday
    const todayStr = new Date().toISOString().split('T')[0];
    for (const admNo of ['ADM-2026-001', 'ADM-2026-002']) {
      const st = studentMap[admNo];
      if (st) {
        await this.prisma.attendance.upsert({
          where: { studentId_date: { studentId: st.id, date: todayStr } },
          update: {},
          create: {
            schoolId: school.id,
            sectionId: st.sectionId,
            studentId: st.id,
            date: todayStr,
            status: AttendanceStatus.PRESENT,
            markedBy: schoolAdmin.id,
          },
        });
      }
    }

    // 10. Seed Exam Term & Marks
    const examTerm = await this.prisma.examTerm.upsert({
      where: {
        schoolId_name_academicYear: {
          schoolId: school.id,
          name: 'Midterm Examination 2026',
          academicYear: '2026-2027',
        },
      },
      update: {},
      create: {
        schoolId: school.id,
        name: 'Midterm Examination 2026',
        academicYear: '2026-2027',
        startDate: new Date('2026-10-10'),
        endDate: new Date('2026-10-25'),
      },
    });

    const alice = studentMap['ADM-2026-001'];
    if (alice && subjectMap['MATH']) {
      await this.prisma.mark.upsert({
        where: {
          examTermId_studentId_subjectId: {
            examTermId: examTerm.id,
            studentId: alice.id,
            subjectId: subjectMap['MATH'].id,
          },
        },
        update: {},
        create: {
          schoolId: school.id,
          examTermId: examTerm.id,
          studentId: alice.id,
          subjectId: subjectMap['MATH'].id,
          totalMarks: 100,
          obtainedMarks: 94,
          grade: 'A+',
          comments: 'Outstanding performance in calculus and proofs.',
        },
      });
    }

    // 11. Seed Fee Challans
    if (alice) {
      await this.prisma.feeChallan.upsert({
        where: { challanNumber: 'CH-2026-10-00001' },
        update: {},
        create: {
          schoolId: school.id,
          studentId: alice.id,
          challanNumber: 'CH-2026-10-00001',
          title: 'October 2026 Tuition Fee',
          month: 'October',
          academicYear: '2026-2027',
          dueDate: new Date('2026-10-15'),
          amount: 450,
          paidAmount: 450,
          status: FeeStatus.PAID,
          paymentDate: new Date('2026-10-01'),
          paymentMethod: 'Bank Transfer',
        },
      });
    }

    const bob = studentMap['ADM-2026-002'];
    if (bob) {
      await this.prisma.feeChallan.upsert({
        where: { challanNumber: 'CH-2026-10-00002' },
        update: {},
        create: {
          schoolId: school.id,
          studentId: bob.id,
          challanNumber: 'CH-2026-10-00002',
          title: 'October 2026 Tuition Fee',
          month: 'October',
          academicYear: '2026-2027',
          dueDate: new Date('2026-10-15'),
          amount: 450,
          paidAmount: 0,
          status: FeeStatus.UNPAID,
        },
      });
    }

    this.logger.log('Database seeded successfully with all sample roles, students, marks, fees & schedules!');
    return {
      success: true,
      message: 'Demo school and accounts seeded successfully',
      credentials: {
        superadmin: { email: 'superadmin@academix.com', password: 'SuperAdmin@123' },
        admin: { email: 'admin@oakridge.edu', password: 'Admin@123' },
        teacher: { email: 'sarah@oakridge.edu', password: 'Teacher@123' },
        student: { email: 'alice@oakridge.edu', password: 'Student@123' },
        parent: { email: 'robert.parent@oakridge.edu', password: 'Parent@123' },
      },
    };
  }
}
