import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserProfileDto, UpdateUserStatusDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Get()
  async listUsers(@CurrentUser() user: CurrentUserPayload) {
    return this.usersService.listUsersBySchool(user.schoolId!);
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateUserProfileDto,
  ) {
    return this.usersService.updateUserProfile(user.userId, dto);
  }

  @Get(':id')
  async getUser(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.usersService.getUserById(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  @Patch(':id/status')
  async updateUserStatus(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.usersService.updateUserStatus(id, dto, user);
  }
}
