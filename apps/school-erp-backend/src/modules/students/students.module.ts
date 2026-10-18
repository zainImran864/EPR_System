import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { AchievementsService } from './achievements.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, AchievementsService],
  exports: [StudentsService, AchievementsService],
})
export class StudentsModule {}
