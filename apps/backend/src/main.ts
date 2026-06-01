import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { initSystem } from './sys.bootstrap';
import cookieParser from 'cookie-parser';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as express from 'express';
import { join } from 'path';

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  initSystem();
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger: ['error', 'warn'],
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
    setHeaders: (res) => {
      res.set('Access-Control-Allow-Origin', '*');
    }
  });

  // cookieParser MUST be registered before CORS and guards so JWT can read cookies
  app.use(cookieParser());

  // Increase payload limit for large base64 file uploads (e.g., checklist evidence)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Convert incoming snake_case request body keys to camelCase
  const toCamel = (s: string) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  const convertKeysToCamel = (input: any): any => {
    if (input === null || input === undefined) return input;
    if (Array.isArray(input)) return input.map(convertKeysToCamel);
    if (typeof input !== 'object') return input;
    const out: any = {};
    for (const key of Object.keys(input)) {
      const val = input[key];
      const camelKey = toCamel(key);
      out[camelKey] = convertKeysToCamel(val);
      // ✅ Preserve the original key as well so DTOs can use either casing
      if (camelKey !== key) {
        out[key] = convertKeysToCamel(val);
      }
    }
    return out;
  };

  app.use((req, _res, next) => {
    try {
      if (req.body && typeof req.body === 'object') {
        req.body = convertKeysToCamel(req.body);
      }
    } catch (err) {
      // ignore conversion errors and proceed
    }
    next();
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const configuredOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';

  app.enableCors({
    origin: (origin, callback) => {
      // Allow non-browser requests (e.g. curl/postman/server-to-server)
      if (!origin) return callback(null, true);

      if (configuredOrigins.includes(origin)) {
        return callback(null, true);
      }

      // In development, allow localhost and private-LAN origins on any port.
      if (!isProduction) {
        try {
          const parsed = new URL(origin);
          const host = parsed.hostname;
          const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
          const isPrivateLan = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(host);

          if (isLocalHost || isPrivateLan) {
            return callback(null, true);
          }
        } catch {
          // Ignore parse errors; reject below.
        }
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });


  const port = Number(process.env.PORT || 3001);
  await app.listen(port);
  console.log(`Server is running on port ${port}`);
}
bootstrap();
