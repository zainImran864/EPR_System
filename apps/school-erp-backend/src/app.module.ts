import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { SchoolsModule } from './modules/schools/schools.module';
import { UsersModule } from './modules/users/users.module';
import { ClassesModule } from './modules/classes/classes.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { StudentsModule } from './modules/students/students.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { MarksModule } from './modules/marks/marks.module';
import { FeesModule } from './modules/fees/fees.module';
import { TimetableModule } from './modules/timetable/timetable.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SeedModule } from './modules/seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env', '.env'],
    }),
    DatabaseModule,
    AuthModule,
    SchoolsModule,
    UsersModule,
    ClassesModule,
    TeachersModule,
    StudentsModule,
    AttendanceModule,
    MarksModule,
    FeesModule,
    TimetableModule,
    NotificationsModule,
    AuditModule,
    DashboardModule,
    SeedModule,
  ],
})
export class AppModule {}
