
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { SsoController } from './sso.controller';
import { DeptWebhookController } from './dept-webhook.controller';
import { MockController } from './mock.controller';
import { SsoService } from './sso.service';
import { PrismaService } from '../database/prisma.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: parseInt(process.env.JWT_EXPIRATION || '3600') },
    }),
  ],
  controllers: [SsoController, DeptWebhookController, MockController],
  providers: [SsoService, PrismaService],
})
export class SsoModule {}
