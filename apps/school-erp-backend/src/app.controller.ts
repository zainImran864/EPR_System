import { Controller, Get, Optional } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './database/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'school-erp-backend',
      timestamp: new Date().toISOString(),
      databaseLoadBalancer: this.prisma?.getLoadBalancerStatus
        ? this.prisma.getLoadBalancerStatus()
        : undefined,
    };
  }
}
