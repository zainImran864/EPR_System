import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { SeedService } from '../src/modules/seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const seedService = app.get(SeedService);

  try {
    await seedService.seedAll();
    console.log('✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
