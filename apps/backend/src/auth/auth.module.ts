import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import { AuthController } from './adapters/auth.controller';
import { UsersRepository } from './infra/users.repository';
import { GoogleStrategy } from './infra/strategies/google.strategy';
import { JwtStrategy } from './infra/strategies/jwt.strategy';
import { AuthenticateUser } from './use-cases/authenticate-user';
import { OnboardUser } from './use-cases/onboard-user';
import { GetMe } from './use-cases/get-me';
import { SignOut } from './use-cases/sign-out';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ListsModule } from '../lists/lists.module';
import { ColorModule } from '../colors/color.module';

@Module({
  imports: [
    PassportModule,
    ListsModule,
    ColorModule,
    JwtModule.register({
      secret: (() => {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return secret;
      })(),
      signOptions: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    GoogleStrategy,
    JwtStrategy,
    UsersRepository,
    AuthenticateUser,
    OnboardUser,
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
