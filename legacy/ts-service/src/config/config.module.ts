import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_URL: Joi.string().required(),
        GEMINI_API_KEY: Joi.string().required(),
        ALLOWED_ORIGINS: Joi.string().optional(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
  ],
})
export class AppConfigModule {}
