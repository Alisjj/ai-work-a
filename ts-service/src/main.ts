import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { QueryFailedFilter } from './common/filters/query-failed.filter';

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

  app.useGlobalFilters(new QueryFailedFilter());

  // Enable CORS for development
  app.enableCors();

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('TalentFlow API')
    .setDescription('Candidate Document Intake + Summary Workflow API\n\nPOST /candidates: No auth required\nOther endpoints: requires x-user-id and x-workspace-id headers')
    .setVersion('1.0')
    .addSecurity('x-user-id', {
      type: 'apiKey',
      in: 'header',
      name: 'x-user-id',
      description: 'User ID'
    })
    .addSecurity('x-workspace-id', {
      type: 'apiKey',
      in: 'header',
      name: 'x-workspace-id',
      description: 'Workspace ID'
    })
    .addTag('candidates')
    .addTag('documents')
    .addTag('summaries')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  
  // Add security to all endpoints
  for (const path in document.paths) {
    const pathItem = document.paths[path] as any;
    for (const method in pathItem) {
      // POST /candidates only requires x-workspace-id
      if (method === 'post' && path === '/candidates') {
        pathItem[method].security = [{ 'x-workspace-id': [] }];
        continue;
      }
      
      // Other endpoints require both headers
      if (!pathItem[method].security) {
        pathItem[method].security = [
          { 'x-user-id': [] },
          { 'x-workspace-id': [] }
        ];
      }
    }
  }
  
  SwaggerModule.setup('api', app, document);

  const port = Number(configService.get('PORT') ?? 3000);
  await app.listen(port);
}

bootstrap();
