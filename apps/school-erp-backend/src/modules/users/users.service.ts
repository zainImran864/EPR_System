import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateUserProfileDto, UpdateUserStatusDto } from './dto/user.dto';

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

  async getUserById(id: string) {
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
        createdAt: true,
        school: true,
      },
    });

    if (!user) throw new NotFoundException('User not found');
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

  async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
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
