import { Global, Logger, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrismaService } from './prisma.service';
import { RedisService } from './redis.service';

const isJestVm = Boolean(process.env.JEST_WORKER_ID);
const mongoLogger = new Logger('MongoService');
const mongoUri = (process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/school_erp').replace('localhost', '127.0.0.1');

@Global()
@Module({
  imports: [
    ...(isJestVm
      ? []
      : [
          MongooseModule.forRoot(mongoUri, {
            family: 4,
            serverSelectionTimeoutMS: 5000,
            onConnectionCreate: (connection) => {
              connection.on('connected', () => {
                mongoLogger.log(`✅ [MongoService] Connected to MongoDB server at ${mongoUri}`);
              });
              connection.on('error', (err) => {
                mongoLogger.warn(`⚠️ [MongoService] Connection warning: ${err.message}`);
              });
              return connection;
            },
          }),
        ]),
  ],
  providers: [PrismaService, RedisService],
  exports: [PrismaService, RedisService, ...(isJestVm ? [] : [MongooseModule])],
})
export class DatabaseModule {}
