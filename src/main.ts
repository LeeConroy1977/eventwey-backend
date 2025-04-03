import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';

import * as dotenv from 'dotenv';
import * as path from 'path';

const env = process.env.NODE_ENV || 'development';

dotenv.config({ path: path.resolve(__dirname, `../.env.${env}`) });

async function bootstrap() {
  if (process.env.NODE_ENV === 'production') {
    dotenv.config({ path: '.env.production' });
  } else if (process.env.NODE_ENV === 'test') {
    dotenv.config({ path: '.env.test' });
  } else {
    dotenv.config({ path: '.env.development' });
  }
  console.log('NODE_ENV:', process.env.NODE_ENV);
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.use(cookieParser());
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
