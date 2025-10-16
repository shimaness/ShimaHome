import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';

async function bootstrap() {
  const allowedOrigin = process.env.WEB_ORIGIN || 'http://localhost:3000';
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: [allowedOrigin],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  });
  app.use(
    helmet({
      contentSecurityPolicy: false, // keep simple for API; web will set CSP
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
