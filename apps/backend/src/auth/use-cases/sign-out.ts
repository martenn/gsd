import { Injectable } from '@nestjs/common';
import * as express from 'express';
import { SignOutResponseDto } from '@gsd/types';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class SignOut {
  constructor(private readonly logger: AppLogger) {
    this.logger.setContext(SignOut.name);
  }

  execute(response: express.Response, userId: string): SignOutResponseDto {
    this.logger.log(`Signing out user: ${userId}`);

    response.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    this.logger.log(`User signed out successfully: ${userId}`);

    return {
      message: 'Signed out successfully',
    };
  }
}
