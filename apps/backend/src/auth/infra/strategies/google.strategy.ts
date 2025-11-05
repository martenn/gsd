import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { User } from '@prisma/client';
import { AuthenticateUser } from '../../use-cases/authenticate-user';
import { GoogleProfile } from '../../dto/google-profile.dto';
import { AppLogger } from '../../../logger/app-logger';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUser,
    private readonly logger: AppLogger,
  ) {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;

    if (!clientID) {
      throw new Error('GOOGLE_CLIENT_ID environment variable is required');
    }
    if (!clientSecret) {
      throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
    }
    if (!callbackURL) {
      throw new Error('GOOGLE_CALLBACK_URL environment variable is required');
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['profile', 'email'],
    });
    this.logger.setContext(GoogleStrategy.name);
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifyCallback,
  ): Promise<User> {
    try {
      this.logger.log(`Google OAuth callback received for user: ${profile.emails?.[0]?.value}`);

      const user = await this.authenticateUserUseCase.execute(profile);

      this.logger.log(`Google OAuth validation successful: ${user.id}`);

      done(null, user);
      return user;
    } catch (error) {
      this.logger.error(
        `Google OAuth validation failed - profileId: ${profile.id}, error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );

      const authError = new UnauthorizedException('Failed to authenticate with Google');
      done(authError, false);
      throw authError;
    }
  }
}
