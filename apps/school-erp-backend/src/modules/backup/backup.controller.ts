import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
  Res,
  Param,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { BackupService } from './backup.service';
import type { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('backup')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('now')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async triggerBackup(@Request() req: any) {
    const schoolId = req.user.schoolId;
    return this.backupService.generateBackup(schoolId);
  }

  @Get('status')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async getStatus(@Request() req: any) {
    const schoolId = req.user.schoolId;
    return this.backupService.getBackupStatus(schoolId);
  }

  @Patch('config')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async updateConfig(@Request() req: any, @Body() body: any) {
    const schoolId = req.user.schoolId;
    return this.backupService.updateConfig(schoolId, body);
  }

  @Get('download/:filename')
  @Roles(Role.ADMIN, Role.SUPERADMIN)
  async downloadFile(
    @Request() req: any,
    @Param('filename') filename: string,
    @Res() res: Response,
  ) {
    // Basic sanitization
    const cleanFilename = path.basename(filename);
    const filePath = path.join(process.cwd(), 'backups', cleanFilename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Backup file not found' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFilename}"`);
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  }
}
