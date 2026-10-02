import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { FeesService } from './fees.service';
import { CreateChallanDto, PayChallanDto, GenerateBulkChallansDto, SetStudentDiscountDto } from './dto/fees.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role, FeeStatus } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('fees')
export class FeesController {
  constructor(private readonly feesService: FeesService) {}

  @Get('challans')
  async listChallans(
    @CurrentUser() user: CurrentUserPayload,
    @Query('status') status?: FeeStatus,
    @Query('studentId') studentId?: string,
    @Query('classId') classId?: string,
    @Query('month') month?: string,
  ) {
    return this.feesService.listChallans(user.schoolId!, { status, studentId, classId, month });
  }

  @Get('challans/:id')
  async getChallan(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.feesService.getChallanById(user.schoolId!, id);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('challans')
  async createChallan(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateChallanDto,
  ) {
    return this.feesService.createChallan(user.schoolId!, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch('student-discount/:studentId')
  async setStudentDiscount(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
    @Body() dto: SetStudentDiscountDto,
  ) {
    return this.feesService.setStudentDiscount(user.schoolId!, studentId, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('challans/bulk')
  async generateBulkChallans(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: GenerateBulkChallansDto,
  ) {
    return this.feesService.generateBulkChallans(user.schoolId!, dto);
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Post('challans/:id/pay')
  async payChallan(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: PayChallanDto,
  ) {
    return this.feesService.payChallan(user.schoolId!, id, dto);
  }

  @Get('student/:studentId/ledger')
  async getStudentLedger(
    @CurrentUser() user: CurrentUserPayload,
    @Param('studentId') studentId: string,
  ) {
    return this.feesService.getStudentLedger(user.schoolId!, studentId);
  }
}
