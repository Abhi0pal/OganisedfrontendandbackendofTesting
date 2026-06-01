import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { PrismaModule } from '../database/prisma.module'; // <-- import this!

import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { MailModule } from '../mail/mail.module';
//import { UsersModule } from '../users/users.module';


@Module({
  imports: [
    //UsersModule,
    PassportModule,
    PrismaModule,
    MailModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: parseInt(process.env.JWT_EXPIRATION || '3600') },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule { }
