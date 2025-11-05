import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { JwtPayload } from '../../dto/jwt-payload.dto';
import { JwtUser } from '../../dto/jwt-user.dto';
import { AppLogger } from '../../../logger/app-logger';

const cookieExtractor = (req: Request): string | null => {
  if (req?.cookies?.jwt) {
    return req.cookies.jwt as string;
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly logger: AppLogger) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([cookieExtractor]),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
    this.logger.setContext(JwtStrategy.name);
  }

  validate(payload: JwtPayload): JwtUser {
    if (!payload.sub || !payload.email) {
      this.logger.warn(`Invalid JWT payload: ${JSON.stringify(payload)}`);
      throw new UnauthorizedException('Invalid token payload');
    }

    this.logger.debug(`JWT validated for user: ${payload.sub}`);

    return {
      id: payload.sub,
      email: payload.email,
    };
  }
}
