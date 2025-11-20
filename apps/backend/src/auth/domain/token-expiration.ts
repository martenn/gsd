export class TokenExpiration {
  private readonly durationInSeconds: number;

  private constructor(durationInSeconds: number) {
    if (durationInSeconds <= 0) {
      throw new Error('Token expiration must be positive');
    }
    this.durationInSeconds = durationInSeconds;
  }

  static fromEnv(): TokenExpiration {
    const duration = process.env.JWT_EXPIRES_IN || '7d';
    return TokenExpiration.parse(duration);
  }

  static parse(duration: string): TokenExpiration {
    const match = duration.match(/^(\d+)([smhd])?$/);
    if (!match) {
      throw new Error(
        `Invalid duration format: "${duration}". Expected formats: "7d", "24h", "60m", "3600s", or "3600"`,
      );
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] || 's';

    const secondsMap: Record<string, number> = {
      s: value,
      m: value * 60,
      h: value * 60 * 60,
      d: value * 24 * 60 * 60,
    };

    const seconds = secondsMap[unit];
    if (seconds === undefined) {
      throw new Error(`Unsupported time unit: "${unit}"`);
    }

    return new TokenExpiration(seconds);
  }

  toSeconds(): number {
    return this.durationInSeconds;
  }

  toMilliseconds(): number {
    return this.durationInSeconds * 1000;
  }

  toString(): string {
    const DAY = 24 * 60 * 60;
    const HOUR = 60 * 60;
    const MINUTE = 60;

    if (this.durationInSeconds % DAY === 0) {
      return `${this.durationInSeconds / DAY}d`;
    }
    if (this.durationInSeconds % HOUR === 0) {
      return `${this.durationInSeconds / HOUR}h`;
    }
    if (this.durationInSeconds % MINUTE === 0) {
      return `${this.durationInSeconds / MINUTE}m`;
    }
    return `${this.durationInSeconds}s`;
  }
}
