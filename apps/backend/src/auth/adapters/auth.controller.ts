import {
  Controller,
  Get,
  Post,
  UseGuards,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import * as express from 'express';
import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import type { GetMeResponseDto, SignOutResponseDto } from '@gsd/types';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { CurrentUser } from '../decorators/current-user.decorator';
import { GetMe } from '../use-cases/get-me';
import { SignOut } from '../use-cases/sign-out';
import { JwtPayload } from '../dto/jwt-payload.dto';
import { AppLogger } from '../../logger/app-logger';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly getMeUseCase: GetMe,
    private readonly signOutUseCase: SignOut,
    private readonly jwtService: JwtService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthController.name);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth() {
    // Initiates Google OAuth flow - redirect handled by Passport
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@CurrentUser() user: User, @Res() response: express.Response) {
    try {
      this.logger.log(
        `Google OAuth callback successful for user: ${user.id}`,
      );

      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
      };

      const token = this.jwtService.sign(payload);

      const isProduction = process.env.NODE_ENV === 'production';
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      response.cookie('jwt', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge,
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
      const redirectUrl = `${frontendUrl}/auth/callback?success=true`;

      this.logger.log(`Redirecting to frontend: ${redirectUrl}`);

      return response.redirect(HttpStatus.FOUND, redirectUrl);
    } catch (error) {
      this.logger.error(
        `OAuth callback error - userId: ${user?.id}, error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
      const errorUrl = `${frontendUrl}/auth/callback?error=server_error`;

      return response.redirect(HttpStatus.FOUND, errorUrl);
    }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: { id: string; email: string }): Promise<GetMeResponseDto> {
    const userData = await this.getMeUseCase.execute(user.id);
    return { user: userData };
  }

  @Post('signout')
  @UseGuards(JwtAuthGuard)
  signOut(@CurrentUser() user: { id: string; email: string }, @Res({ passthrough: true }) response: express.Response): SignOutResponseDto {
    return this.signOutUseCase.execute(response, user.id);
  }
}
