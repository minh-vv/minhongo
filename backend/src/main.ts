import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5174', 'http://localhost:5175'],
    credentials: true,
  });

  app.use(bodyParser.json({ limit: '50mb' }));

  await app.listen(process.env.PORT ?? 3002);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
