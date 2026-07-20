import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    // Suppress verbose NestJS startup logs in production
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global prefix — all routes live under /api/v1
  app.setGlobalPrefix('api/v1');

  // CORS — lock down in production via CORS_ORIGIN env var
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : '*';

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    maxAge: 86400, // Pre-flight cache: 24 h
  });

  // Graceful shutdown: give in-flight requests 5 s to complete
  app.enableShutdownHooks();

  const port = parseInt(process.env.PORT ?? '3000', 10);
  await app.listen(port);

  logger.log(`🚀  Application  → http://localhost:${port}/api/v1`);
  logger.log(`🌍  Environment  → ${process.env.NODE_ENV ?? 'development'}`);
  logger.log(`🗄️  Database     → ${process.env.DATABASE_URL?.split('@')[1] ?? 'configured'}`);
}

bootstrap().catch((err: Error) => {
  new Logger('Bootstrap').fatal(`Failed to start: ${err.message}`, err.stack);
  process.exit(1);
});
