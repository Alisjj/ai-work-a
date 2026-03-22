import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AppModule } from '../../src/app.module';
import { FakeSummarizationProvider } from '../../src/llm/fake-summarization.provider';
import { SUMMARIZATION_PROVIDER } from '../../src/llm/summarization-provider.interface';

export async function createE2eApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(SUMMARIZATION_PROVIDER)
    .useClass(FakeSummarizationProvider)
    .compile();

  const app = moduleFixture.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.init();

  return app;
}
