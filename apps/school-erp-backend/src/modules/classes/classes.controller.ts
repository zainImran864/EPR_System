import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ClassesService } from './classes.service';
import {
  CreateClassDto,
  UpdateClassDto,
  CreateSectionDto,
  UpdateSectionDto,
  CreateSubjectDto,
} from './dto/class.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  async listClasses(@CurrentUser() user: CurrentUserPayload) {
    return this.classesService.listClasses(user.schoolId!);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  async createClass(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateClassDto,
  ) {
    return this.classesService.createClass(user.schoolId!, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateClass(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateClassDto,
  ) {
    return this.classesService.updateClass(user.schoolId!, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('sections')
  async createSection(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSectionDto,
  ) {
    return this.classesService.createSection(user.schoolId!, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('sections/:id')
  async updateSection(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateSectionDto,
  ) {
    return this.classesService.updateSection(user.schoolId!, id, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Delete('sections/:id')
  async deleteSection(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.classesService.deleteSection(user.schoolId!, id);
  }

  @Get('subjects')
  async listSubjects(@CurrentUser() user: CurrentUserPayload) {
    return this.classesService.listSubjects(user.schoolId!);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('subjects')
  async createSubject(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.classesService.createSubject(user.schoolId!, dto);
  }
}
