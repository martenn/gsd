import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { UsersRepository } from '../infra/users.repository';
import { GoogleProfile } from '../dto/google-profile.dto';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class AuthenticateUser {
  constructor(
    private readonly repository: UsersRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AuthenticateUser.name);
  }

  async execute(profile: GoogleProfile): Promise<User> {
    const googleId = profile.id;
    const email = profile.emails[0]?.value;
    const name = profile.displayName || this.constructName(profile.name);

    if (!email) {
      this.logger.error(
        `Google profile missing email - googleId: ${googleId}, profile: ${JSON.stringify(profile)}`,
      );
      throw new Error('Google profile must include email');
    }

    this.logger.log(`Authenticating user with Google ID: ${googleId}`);

    try {
      const user = await this.repository.upsertByGoogleId({
        googleId,
        email,
        name,
      });

      this.logger.log(`User authenticated successfully: ${user.id} (${user.email})`);

      return user;
    } catch (error) {
      this.logger.error(
        `Failed to authenticate user - googleId: ${googleId}, email: ${email}, error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private constructName(name?: { givenName?: string; familyName?: string }): string | null {
    if (!name) return null;
    const parts = [name.givenName, name.familyName].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : null;
  }
}
