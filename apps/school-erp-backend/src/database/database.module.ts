import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';

@Global()
@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_erp',
    ),
  ],
  providers: [PrismaService, RedisService],
  exports: [PrismaService, RedisService, MongooseModule],
})
export class DatabaseModule {}
