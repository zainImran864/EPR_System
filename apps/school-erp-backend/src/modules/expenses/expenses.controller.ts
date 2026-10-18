import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseQueryDto,
  TrackingQueryDto,
} from './dto/expense.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN, Role.SUPERADMIN)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async createExpense(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateExpenseDto,
  ) {
    return this.expensesService.createExpense(user.schoolId!, user.userId, dto);
  }

  @Get('tracking')
  async getFinancialTracking(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: TrackingQueryDto,
  ) {
    return this.expensesService.getFinancialTracking(user.schoolId!, query);
  }

  @Get()
  async listExpenses(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: ExpenseQueryDto,
  ) {
    return this.expensesService.listExpenses(user.schoolId!, query);
  }

  @Get(':id')
  async getExpenseById(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.expensesService.getExpenseById(user.schoolId!, id);
  }

  @Patch(':id')
  async updateExpense(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.updateExpense(user.schoolId!, id, dto);
  }

  @Delete(':id')
  async deleteExpense(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
  ) {
    return this.expensesService.deleteExpense(user.schoolId!, id);
  }
}
