import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('AcademiX-Backend');
  const app = await NestFactory.create(AppModule);

  // Global prefix e.g. http://localhost:3001/api/...
  app.setGlobalPrefix('api');

  // Enable CORS for frontend development and desktop clients
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global exception filter and response transformer
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.PORT || 3001;
  await app.listen(port, '127.0.0.1');
  logger.log(`🚀 AcademiX School ERP Backend running locally on: http://127.0.0.1:${port}/api`);
}

bootstrap();
