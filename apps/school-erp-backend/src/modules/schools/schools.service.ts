import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RedisService } from '../../database/redis.service';
import { UpdateSchoolDto, UpdateSmtpDto, TestSmtpDto } from './dto/school.dto';
import { RequestStatus, Role, UserStatus } from '@prisma/client';
import * as nodemailer from 'nodemailer';

@Injectable()
export class SchoolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  async getSchoolByCode(code: string) {
    const cacheKey = `school:code:${code}`;
    const cached = await this.redisService.get(cacheKey);
    if (cached) return cached;

    const school = await this.prisma.school.findUnique({
      where: { code: code.toUpperCase() },
      include: {
        classes: {
          include: { sections: true, subjects: true },
          orderBy: { grade: 'asc' },
        },
      },
    });

    if (!school) {
      throw new NotFoundException(`School with code ${code} not found`);
    }

    await this.redisService.set(cacheKey, school, 3600);
    return school;
  }

  async getSchoolById(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      include: {
        classes: {
          include: { sections: true, subjects: true },
          orderBy: { grade: 'asc' },
        },
      },
    });

    if (!school) {
      throw new NotFoundException('School not found');
    }

    return school;
  }

  async updateSchool(schoolId: string, dto: UpdateSchoolDto) {
    const updated = await this.prisma.school.update({
      where: { id: schoolId },
      data: dto,
    });

    await this.redisService.del(`school:code:${updated.code}`);
    return updated;
  }

  async getSmtpSettings(schoolId: string) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
      select: {
        smtpHost: true,
        smtpPort: true,
        smtpUser: true,
        smtpFrom: true,
        smtpSecure: true,
        smtpEnabled: true,
        updatedAt: true,
      },
    });

    if (!school) throw new NotFoundException('School not found');

    return {
      ...school,
      isConfigured: Boolean(school.smtpHost && school.smtpUser),
    };
  }

  async updateSmtp(schoolId: string, dto: UpdateSmtpDto) {
    const dataToUpdate: any = {};
    if (dto.smtpHost !== undefined) dataToUpdate.smtpHost = dto.smtpHost;
    if (dto.smtpPort !== undefined) dataToUpdate.smtpPort = dto.smtpPort;
    if (dto.smtpUser !== undefined) dataToUpdate.smtpUser = dto.smtpUser;
    if (dto.smtpPass !== undefined && dto.smtpPass.trim() !== '') dataToUpdate.smtpPass = dto.smtpPass;
    if (dto.smtpFrom !== undefined) dataToUpdate.smtpFrom = dto.smtpFrom;
    if (dto.smtpSecure !== undefined) dataToUpdate.smtpSecure = dto.smtpSecure;
    if (dto.smtpEnabled !== undefined) dataToUpdate.smtpEnabled = dto.smtpEnabled;

    await this.prisma.school.update({
      where: { id: schoolId },
      data: dataToUpdate,
    });

    return { success: true, message: 'SMTP settings updated successfully' };
  }

  async testSmtpConnection(schoolId: string, dto: TestSmtpDto) {
    const school = await this.prisma.school.findUnique({
      where: { id: schoolId },
    });

    if (!school) throw new NotFoundException('School not found');

    const host = dto.smtpHost || school.smtpHost;
    const port = dto.smtpPort || school.smtpPort || 587;
    const user = dto.smtpUser || school.smtpUser;
    const pass = dto.smtpPass || school.smtpPass;
    const from = dto.smtpFrom || school.smtpFrom || user;
    const secure = dto.smtpSecure !== undefined ? dto.smtpSecure : (school.smtpSecure ?? false);

    if (!host || !user || !pass) {
      throw new BadRequestException(
        'Incomplete SMTP configuration. Please provide Host, Username, and Password to run a test.',
      );
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
      });

      // 1. Verify handshake
      await transporter.verify();

      // 2. Send test email
      await transporter.sendMail({
        from: `"${school.name}" <${from}>`,
        to: dto.toEmail,
        subject: `[AcademiX] SMTP Connection Test for ${school.name}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 550px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <h2 style="color: #0d9488; margin: 0; font-size: 20px;">AcademiX School ERP</h2>
            </div>
            <h3 style="color: #1e293b; margin-top: 0;">SMTP Configuration Successful!</h3>
            <p style="color: #475569; font-size: 14px; line-height: 1.6;">
              This is a verification message confirming that the custom SMTP email configuration for <strong>${school.name}</strong> is operating smoothly.
            </p>
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin: 20px 0; font-size: 13px; color: #334155;">
              <div><strong>Host:</strong> ${host}:${port}</div>
              <div><strong>Sender:</strong> ${from}</div>
              <div><strong>Security:</strong> ${secure ? 'SSL/TLS (Port 465)' : 'STARTTLS / Standard'}</div>
            </div>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 24px;">
              Sent from AcademiX ERP on behalf of ${school.name}.
            </p>
          </div>
        `,
      });

      return {
        success: true,
        message: `SMTP handshake verified and test email successfully delivered to ${dto.toEmail}`,
      };
    } catch (err: any) {
      throw new BadRequestException(
        `SMTP Test Failed: ${err.message || 'Unable to connect to mail server with provided credentials'}`,
      );
    }
  }

  // SuperAdmin operations
  async listAllSchools() {
    return this.prisma.school.findMany({
      include: {
        _count: {
          select: {
            students: true,
            teachers: true,
            classes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listPendingRegistrations() {
    return this.prisma.registrationRequest.findMany({
      where: { status: RequestStatus.PENDING },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveRegistration(requestId: string) {
    const req = await this.prisma.registrationRequest.findUnique({
      where: { id: requestId },
    });

    if (!req) {
      throw new NotFoundException('Registration request not found');
    }

    if (req.status !== RequestStatus.PENDING) {
      throw new BadRequestException(`Request is already ${req.status.toLowerCase()}`);
    }

    // 1. Create the school
    const school = await this.prisma.school.create({
      data: {
        name: req.schoolName,
        code: req.schoolSlug.toUpperCase(),
        email: req.contactEmail,
        phone: req.phone,
        address: req.address,
        activeYear: '2026-2027',
      },
    });

    // 2. Create the School Admin user
    const adminUser = await this.prisma.user.create({
      data: {
        schoolId: school.id,
        name: req.adminName,
        email: req.adminEmail,
        passwordHash: req.adminPasswordHash,
        role: Role.ADMIN,
        status: UserStatus.ACTIVE,
      },
    });

    // 3. Automatically create classes & default sections
    const classesList: number[] = JSON.parse(req.classesOffered || '[]');
    for (const grade of classesList) {
      const createdClass = await this.prisma.class.create({
        data: {
          schoolId: school.id,
          grade,
          name: `Grade ${grade}`,
        },
      });

      // Add default section 'A'
      await this.prisma.section.create({
        data: {
          classId: createdClass.id,
          schoolId: school.id,
          name: 'A',
          capacity: 40,
        },
      });
    }

    // 4. Mark request as approved
    await this.prisma.registrationRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.APPROVED },
    });

    return {
      success: true,
      message: 'School approved and initialized successfully',
      school,
      adminEmail: adminUser.email,
    };
  }

  async rejectRegistration(requestId: string, reason?: string) {
    return this.prisma.registrationRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        rejectionReason: reason || 'Requirements not met',
      },
    });
  }
}
