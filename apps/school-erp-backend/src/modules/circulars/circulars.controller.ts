import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CircularsService } from './circulars.service';
import { CreateCircularDto, QueryCircularDto } from './dto/circular.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('circulars')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CircularsController {
  constructor(private readonly circularsService: CircularsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  async createCircular(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateCircularDto,
  ) {
    return this.circularsService.createCircular(
      {
        id: user.userId,
        role: user.role as Role,
        schoolId: user.schoolId!,
        name: user.name,
      },
      dto,
    );
  }

  @Get()
  async listCirculars(
    @CurrentUser() user: CurrentUserPayload,
    @Query() query: QueryCircularDto,
  ) {
    return this.circularsService.listCirculars(
      {
        id: user.userId,
        role: user.role as Role,
        schoolId: user.schoolId!,
        studentContext: user.studentContext,
      },
      query,
    );
  }

  @Get(':id')
  async getCircularById(@Param('id') id: string) {
    return this.circularsService.getCircularById(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPERADMIN, Role.TEACHER)
  async deleteCircular(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserPayload,
  ) {
    return this.circularsService.deleteCircular(id, {
      id: user.userId,
      role: user.role as Role,
    });
  }
}
