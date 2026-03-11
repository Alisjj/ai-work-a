import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Enable CORS for development
  app.enableCors();

  const port = Number(configService.get('PORT') ?? 3000);
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
  console.log(`📍 Health check: http://localhost:${port}/health`);
}

bootstrap();
