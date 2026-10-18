import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserProfileDto, UpdateUserStatusDto } from './dto/user.dto';
import { CurrentUserPayload } from '../../common/decorators/current-user.decorator';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsersBySchool(schoolId: string) {
    return this.prisma.user.findMany({
      where: { schoolId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        avatarUrl: true,
        themeColor: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserById(id: string, requester?: CurrentUserPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        avatarUrl: true,
        themeColor: true,
        schoolId: true,
        createdAt: true,
        school: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
    if (
      requester &&
      requester.role !== 'SUPERADMIN' &&
      requester.userId !== id &&
      user.schoolId !== requester.schoolId
    ) {
      throw new ForbiddenException('Access denied to user from another school');
    }
    return user;
  }

  async updateUserProfile(id: string, dto: UpdateUserProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        avatarUrl: true,
        themeColor: true,
      },
    });
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto, requester?: CurrentUserPayload) {
    const existing = await this.prisma.user.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('User not found');
    if (
      requester &&
      requester.role !== 'SUPERADMIN' &&
      existing.schoolId !== requester.schoolId
    ) {
      throw new ForbiddenException('Cannot modify user from another school');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: {
        id: true,
        status: true,
      },
    });
  }
}
