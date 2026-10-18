import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
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
import { ExpensesModule } from './modules/expenses/expenses.module';
import { AuditModule } from './modules/audit/audit.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { SeedModule } from './modules/seed/seed.module';
import { BackupModule } from './modules/backup/backup.module';
import { CircularsModule } from './modules/circulars/circulars.module';
import { HomeworkModule } from './modules/homework/homework.module';
import { MeetingsModule } from './modules/meetings/meetings.module';
import { WhatsAppModule } from './modules/whatsapp/whatsapp.module';
import { HttpLoggerMiddleware } from './common/middleware/http-logger.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    ExpensesModule,
    TimetableModule,
    NotificationsModule,
    WhatsAppModule,
    BackupModule,
    CircularsModule,
    HomeworkModule,
    MeetingsModule,
    AuditModule,
    DashboardModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
