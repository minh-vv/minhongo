import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  app.setGlobalPrefix('api');

  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173'];

  // Automatically add the 'www.' version of each origin if not already present
  const extendedOrigins = [...allowedOrigins];
  allowedOrigins.forEach((origin) => {
    if (origin.startsWith('https://') && !origin.includes('://www.')) {
      extendedOrigins.push(origin.replace('https://', 'https://www.'));
    } else if (origin.startsWith('http://') && !origin.includes('://www.')) {
      extendedOrigins.push(origin.replace('http://', 'http://www.'));
    }
  });

  app.enableCors({
    origin: extendedOrigins,
    credentials: true,
  });

  app.use(bodyParser.json({ limit: '50mb' }));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
