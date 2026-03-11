import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Enable CORS
  const allowedOrigins = configService.get<string>('ALLOWED_ORIGINS');
  if (allowedOrigins) {
    app.enableCors({
      origin: allowedOrigins.split(',').map(origin => origin.trim()),
      credentials: true,
    });
  } else {
    app.enableCors();
  }

  // Set global API prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);
  logger.log(`🚀 Server running on port ${port}`);
  logger.log(`📍 Health check: http://localhost:${port}/health`);
}

bootstrap();
