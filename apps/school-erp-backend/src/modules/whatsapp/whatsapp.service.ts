import { Injectable, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { AuditLog, AuditLogDocument } from '../../database/schemas/audit-log.schema';
import { Notification, NotificationDocument } from '../../database/schemas/notification.schema';
import {
  SendDirectWhatsAppDto,
  SendBatchWhatsAppDto,
  SendReportCardWhatsAppDto,
  SendFeeReminderWhatsAppDto,
  SendAttendanceAlertWhatsAppDto,
  WhatsAppRecipientType,
} from './dto/whatsapp.dto';

@Injectable()
export class WhatsAppService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
    @Optional() @InjectModel(AuditLog.name) private readonly auditModel: Model<AuditLogDocument> | null,
    @Optional() @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument> | null,
  ) {}

  /**
   * Cleans and normalizes phone numbers for WhatsApp.
   * Strips all non-digit characters (+, -, spaces, parentheses).
   */
  private normalizePhone(phone: string): string {
    if (!phone) return '';
    let cleaned = phone.replace(/\D/g, '');
    // If starts with 0 (e.g. 03001234567 in Pakistan), replace leading 0 with 92 default or preserve international code
    if (cleaned.startsWith('0') && cleaned.length === 11) {
      cleaned = '92' + cleaned.substring(1);
    }
    return cleaned;
  }

  /**
   * Generates a direct WhatsApp Click-to-Chat URL
   */
  generateWhatsAppUrl(phone: string, text: string): string {
    const cleanPhone = this.normalizePhone(phone);
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 1. Directory of Available Recipients
  // ─────────────────────────────────────────────────────────────────────────

  async getRecipients(schoolId: string, search?: string) {
    const [teachers, students] = await Promise.all([
      this.prisma.teacher.findMany({
        where: { schoolId },
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          designation: true,
        },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.student.findMany({
        where: { schoolId, status: 'active' },
        include: {
          class: true,
          section: true,
          parent: true,
        },
        orderBy: { fullName: 'asc' },
      }),
    ]);

    const parents = students
      .filter((s) => s.parent && s.parent.phone)
      .map((s) => ({
        parentId: s.parent!.id,
        parentName: s.parent!.fullName,
        phone: s.parent!.phone!,
        studentId: s.id,
        studentName: s.fullName,
        rollNumber: s.rollNumber,
        className: s.class.name,
        sectionName: s.section.name,
        classId: s.classId,
        sectionId: s.sectionId,
      }));

    return {
      teachers: teachers.map((t) => ({
        id: t.id,
        name: t.fullName,
        phone: t.phone || '',
        designation: t.designation || 'Faculty Teacher',
        email: t.email,
        type: 'TEACHER',
      })),
      parents,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Direct Messaging
  // ─────────────────────────────────────────────────────────────────────────

  async prepareDirectMessage(
    schoolId: string,
    sender: { userId: string; role: string; name?: string },
    dto: SendDirectWhatsAppDto,
  ) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    let recipientPhone = dto.phone || '';
    let recipientName = dto.recipientName || 'Recipient';

    if (dto.recipientType === WhatsAppRecipientType.TEACHER && dto.recipientId) {
      const teacher = await this.prisma.teacher.findFirst({
        where: { id: dto.recipientId, schoolId },
      });
      if (teacher) {
        recipientPhone = teacher.phone || recipientPhone;
        recipientName = teacher.fullName;
      }
    } else if (dto.recipientType === WhatsAppRecipientType.PARENT && dto.recipientId) {
      const parent = await this.prisma.parent.findFirst({
        where: { id: dto.recipientId },
      });
      if (parent) {
        recipientPhone = parent.phone || recipientPhone;
        recipientName = parent.fullName;
      }
    } else if (dto.studentId) {
      const student = await this.prisma.student.findFirst({
        where: { id: dto.studentId, schoolId },
        include: { parent: true },
      });
      if (student?.parent?.phone) {
        recipientPhone = student.parent.phone;
        recipientName = student.parent.fullName;
      }
    }

    if (!recipientPhone) {
      throw new BadRequestException('Recipient has no registered WhatsApp phone number.');
    }

    const whatsAppUrl = this.generateWhatsAppUrl(recipientPhone, dto.message);

    // Record audit event
    if (this.auditModel) {
      try {
        await this.auditModel.create({
          schoolId,
          userId: sender.userId,
          userName: sender.name || 'User',
          userRole: sender.role || 'ADMIN',
          action: 'WHATSAPP_MESSAGE_SENT',
          module: 'whatsapp',
          details: {
            recipientType: dto.recipientType,
            recipientName,
            recipientPhone: this.normalizePhone(recipientPhone),
            templateType: dto.templateType || 'CUSTOM',
          },
        });
      } catch {}
    }

    return {
      success: true,
      recipientName,
      recipientPhone: this.normalizePhone(recipientPhone),
      message: dto.message,
      whatsAppUrl,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. 1-Click WhatsApp Report Card Share
  // ─────────────────────────────────────────────────────────────────────────

  async sendReportCardWhatsApp(
    schoolId: string,
    sender: { userId: string; role: string; name?: string },
    dto: SendReportCardWhatsAppDto,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
      include: {
        school: true,
        class: true,
        section: true,
        parent: true,
        marks: {
          include: { subject: true, examTerm: true },
          orderBy: { subject: { name: 'asc' } },
        },
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    const parentPhone = student.parent?.phone || student.emergencyContact;
    if (!parentPhone) {
      throw new BadRequestException(`No contact number found for ${student.fullName}'s guardian.`);
    }

    // Filter marks by term if requested
    const marks = dto.examTermId
      ? student.marks.filter((m) => m.examTermId === dto.examTermId)
      : student.marks;

    const totalObtained = marks.reduce((sum, m) => sum + m.obtainedMarks, 0);
    const totalPossible = marks.reduce((sum, m) => sum + m.totalMarks, 0);
    const percentage = totalPossible > 0 ? (totalObtained / totalPossible) * 100 : 0;
    const examTermName = marks[0]?.examTerm?.name || 'Latest Term';

    const subjectBreakdown = marks
      .map((m) => `  • ${m.subject.name}: *${m.obtainedMarks}* / ${m.totalMarks} (${m.grade || '—'})`)
      .join('\n');

    const message = `🎓 *${student.school.name} — Academic Report Alert*

Dear *${student.parent?.fullName || 'Parent / Guardian'}*,

Here is the academic performance report for *${student.fullName}* (Roll No: ${student.rollNumber || '—'}, ${student.class.name} - ${student.section.name}):

📋 *Examination:* ${examTermName}
📊 *Total Score:* ${totalObtained} / ${totalPossible} (${percentage.toFixed(1)}%)
🏆 *Overall Result:* ${percentage >= 50 ? '✅ PASSED' : '⚠️ AT-RISK'}

*Subject Breakdown:*
${subjectBreakdown || '  • Marks compiled in transcript'}

${dto.customRemarks ? `📝 *Teacher Remarks:* ${dto.customRemarks}\n\n` : ''}🔗 You can view and download the full official transcript directly in your Parent Portal.

— *${student.school.name}*`;

    const whatsAppUrl = this.generateWhatsAppUrl(parentPhone, message);

    // Audit log
    if (this.auditModel) {
      try {
        await this.auditModel.create({
          schoolId,
          userId: sender.userId,
          userName: sender.name || 'Teacher',
          userRole: sender.role || 'TEACHER',
          action: 'WHATSAPP_REPORT_CARD_SHARED',
          module: 'marks',
          details: {
            studentId: student.id,
            studentName: student.fullName,
            parentName: student.parent?.fullName,
            phone: this.normalizePhone(parentPhone),
          },
        });
      } catch {}
    }

    return {
      success: true,
      studentName: student.fullName,
      parentName: student.parent?.fullName || 'Guardian',
      phone: this.normalizePhone(parentPhone),
      message,
      whatsAppUrl,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. 1-Click Fee Challan WhatsApp Reminder
  // ─────────────────────────────────────────────────────────────────────────

  async sendFeeReminderWhatsApp(
    schoolId: string,
    sender: { userId: string; role: string },
    dto: SendFeeReminderWhatsAppDto,
  ) {
    const challan = await this.prisma.feeChallan.findFirst({
      where: { id: dto.challanId, schoolId },
      include: {
        school: true,
        student: {
          include: { class: true, section: true, parent: true },
        },
      },
    });

    if (!challan) throw new NotFoundException('Fee challan not found');
    const parentPhone = challan.student.parent?.phone || challan.student.emergencyContact;
    if (!parentPhone) {
      throw new BadRequestException(`No phone number found for ${challan.student.fullName}'s parent.`);
    }

    const remaining = challan.amount - challan.paidAmount;
    const dueDateStr = challan.dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const message = `💳 *${challan.school.name} — Fee Payment Reminder*

Dear *${challan.student.parent?.fullName || 'Parent'}*,

This is a friendly reminder regarding the fee challan for *${challan.student.fullName}* (${challan.student.class.name} - ${challan.student.section.name}):

🧾 *Challan No:* ${challan.challanNumber}
📌 *Title:* ${challan.title}
💰 *Outstanding Amount:* $${remaining.toFixed(2)}
📅 *Due Date:* ${dueDateStr}
⚡ *Status:* ${challan.status}

Kindly clear the dues before the deadline to avoid late submission penalties.

Thank you,
— *${challan.school.name} Administration*`;

    const whatsAppUrl = this.generateWhatsAppUrl(parentPhone, message);

    return {
      success: true,
      studentName: challan.student.fullName,
      parentName: challan.student.parent?.fullName || 'Parent',
      phone: this.normalizePhone(parentPhone),
      message,
      whatsAppUrl,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 5. 1-Click Attendance Absent Alert
  // ─────────────────────────────────────────────────────────────────────────

  async sendAttendanceAlertWhatsApp(
    schoolId: string,
    sender: { userId: string; role: string },
    dto: SendAttendanceAlertWhatsAppDto,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, schoolId },
      include: {
        school: true,
        class: true,
        section: true,
        parent: true,
      },
    });

    if (!student) throw new NotFoundException('Student not found');
    const parentPhone = student.parent?.phone || student.emergencyContact;
    if (!parentPhone) {
      throw new BadRequestException(`No phone number found for ${student.fullName}'s parent.`);
    }

    const message = `⚠️ *${student.school.name} — Student Attendance Notice*

Dear *${student.parent?.fullName || 'Parent'}*,

This is to inform you that your child *${student.fullName}* (Roll No: ${student.rollNumber || '—'}, ${student.class.name} - ${student.section.name}) was marked *${dto.status || 'ABSENT'}* today (${dto.date}).

If this absence was unplanned or if you require assistance, please contact the school front office.

— *${student.school.name}*`;

    const whatsAppUrl = this.generateWhatsAppUrl(parentPhone, message);

    return {
      success: true,
      studentName: student.fullName,
      parentName: student.parent?.fullName || 'Parent',
      phone: this.normalizePhone(parentPhone),
      message,
      whatsAppUrl,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. Batch WhatsApp Messages (Class-wide / Faculty-wide)
  // ─────────────────────────────────────────────────────────────────────────

  async prepareBatchMessages(
    schoolId: string,
    sender: { userId: string; role: string },
    dto: SendBatchWhatsAppDto,
  ) {
    const school = await this.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    let recipientList: { name: string; phone: string; context: string }[] = [];

    if (dto.targetGroup === 'ALL_TEACHERS') {
      const teachers = await this.prisma.teacher.findMany({
        where: { schoolId },
        select: { fullName: true, phone: true, designation: true },
      });
      recipientList = teachers
        .filter((t) => Boolean(t.phone))
        .map((t) => ({
          name: t.fullName,
          phone: t.phone!,
          context: t.designation || 'Teacher',
        }));
    } else {
      const where: any = { schoolId, status: 'active' };
      if (dto.classId) where.classId = dto.classId;
      if (dto.sectionId) where.sectionId = dto.sectionId;

      const students = await this.prisma.student.findMany({
        where,
        include: { parent: true, class: true, section: true },
      });

      recipientList = students
        .filter((s) => Boolean(s.parent?.phone || s.emergencyContact))
        .map((s) => ({
          name: s.parent?.fullName || `Parent of ${s.fullName}`,
          phone: s.parent?.phone || s.emergencyContact!,
          context: `${s.fullName} (${s.class.name} - ${s.section.name})`,
        }));
    }

    const formattedMessages = recipientList.map((rec) => {
      const personalized = dto.message
        .replace(/\{recipient_name\}/g, rec.name)
        .replace(/\{school_name\}/g, school.name);

      return {
        recipientName: rec.name,
        context: rec.context,
        phone: this.normalizePhone(rec.phone),
        message: personalized,
        whatsAppUrl: this.generateWhatsAppUrl(rec.phone, personalized),
      };
    });

    return {
      totalCount: formattedMessages.length,
      targetGroup: dto.targetGroup,
      recipients: formattedMessages,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 7. Standard Templates
  // ─────────────────────────────────────────────────────────────────────────

  getTemplates() {
    return [
      {
        id: 'REPORT_CARD',
        name: 'Report Card / Exam Transcript Alert',
        category: 'ACADEMICS',
        template: '🎓 *{school_name} — Academic Report Alert*\n\nDear {parent_name},\n\nHere are the latest examination results for *{student_name}* (Class {class_name}):\n\n📊 *Term:* {term_name}\n🎯 *Score:* {obtained_marks}/{total_marks} ({percentage}%)\n🏆 *Grade:* {grade}\n\nPlease visit the parent portal for full transcript.',
      },
      {
        id: 'FEE_REMINDER',
        name: 'Fee Challan Due Notice',
        category: 'FINANCE',
        template: '💳 *{school_name} — Fee Reminder*\n\nDear {parent_name},\n\nFee challan #{challan_no} for *{student_name}* ({class_name}) of ${amount} is due on *{due_date}*.\n\nKindly clear dues before deadline. Thank you.',
      },
      {
        id: 'ATTENDANCE_ALERT',
        name: 'Daily Absent Notification',
        category: 'ATTENDANCE',
        template: '⚠️ *{school_name} — Attendance Notice*\n\nDear {parent_name},\n\n*{student_name}* ({class_name}) was marked ABSENT today ({date}).\n\nPlease contact administration if unexcused.',
      },
      {
        id: 'EXAM_NOTICE',
        name: 'Date-Sheet & Roll No Slip Announcement',
        category: 'EXAMS',
        template: '📅 *{school_name} — Exam Notice*\n\nDear {parent_name},\n\nThe date-sheet for *{exam_term}* is published for *{student_name}* (Roll No: {roll_no}). Papers commence on *{start_date}*.',
      },
      {
        id: 'GENERAL_ANNOUNCEMENT',
        name: 'General School Notice',
        category: 'ANNOUNCEMENTS',
        template: '📢 *{school_name} — Official Notice*\n\nDear {recipient_name},\n\n{message_body}\n\n— Administration',
      },
    ];
  }
}
