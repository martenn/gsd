import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './adapters/auth.controller';
import { UsersRepository } from './infra/users.repository';
import { GoogleStrategy } from './infra/strategies/google.strategy';
import { JwtStrategy } from './infra/strategies/jwt.strategy';
import { AuthenticateUser } from './use-cases/authenticate-user';
import { GetMe } from './use-cases/get-me';
import { SignOut } from './use-cases/sign-out';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return secret;
      })(),
      signOptions: {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    GoogleStrategy,
    JwtStrategy,
    UsersRepository,
    AuthenticateUser,
    GetMe,
    SignOut,
    JwtAuthGuard,
    {
      provide: PrismaClient,
      useValue: new PrismaClient(),
    },
  ],
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
