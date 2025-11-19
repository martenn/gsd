import { TokenExpiration } from './token-expiration';

describe('TokenExpiration', () => {
  describe('parse', () => {
    it('should parse days format', () => {
      const expiration = TokenExpiration.parse('7d');
      expect(expiration.toSeconds()).toBe(7 * 24 * 60 * 60);
      expect(expiration.toMilliseconds()).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should parse hours format', () => {
      const expiration = TokenExpiration.parse('24h');
      expect(expiration.toSeconds()).toBe(24 * 60 * 60);
      expect(expiration.toMilliseconds()).toBe(24 * 60 * 60 * 1000);
    });

    it('should parse minutes format', () => {
      const expiration = TokenExpiration.parse('60m');
      expect(expiration.toSeconds()).toBe(60 * 60);
      expect(expiration.toMilliseconds()).toBe(60 * 60 * 1000);
    });

    it('should parse seconds format', () => {
      const expiration = TokenExpiration.parse('3600s');
      expect(expiration.toSeconds()).toBe(3600);
      expect(expiration.toMilliseconds()).toBe(3600 * 1000);
    });

    it('should parse plain number as seconds', () => {
      const expiration = TokenExpiration.parse('3600');
      expect(expiration.toSeconds()).toBe(3600);
      expect(expiration.toMilliseconds()).toBe(3600 * 1000);
    });

    it('should reject invalid format with letters', () => {
      expect(() => TokenExpiration.parse('invalid')).toThrow('Invalid duration format');
    });

    it('should reject invalid format with multiple units', () => {
      expect(() => TokenExpiration.parse('7d2h')).toThrow('Invalid duration format');
    });

    it('should reject empty string', () => {
      expect(() => TokenExpiration.parse('')).toThrow('Invalid duration format');
    });

    it('should reject negative values', () => {
      expect(() => TokenExpiration.parse('-7d')).toThrow('Invalid duration format');
    });

    it('should reject zero duration', () => {
      expect(() => TokenExpiration.parse('0d')).toThrow('Token expiration must be positive');
    });
  });

  describe('toString', () => {
    it('should format as days when divisible by days', () => {
      const expiration = TokenExpiration.parse('7d');
      expect(expiration.toString()).toBe('7d');
    });

    it('should format as hours when divisible by hours but not days', () => {
      const expiration = TokenExpiration.parse('25h');
      expect(expiration.toString()).toBe('25h');
    });

    it('should format as minutes when divisible by minutes but not hours', () => {
      const expiration = TokenExpiration.parse('90m');
      expect(expiration.toString()).toBe('90m');
    });

    it('should format as seconds otherwise', () => {
      const expiration = TokenExpiration.parse('3601s');
      expect(expiration.toString()).toBe('3601s');
    });

    it('should prefer days over hours', () => {
      const expiration = TokenExpiration.parse('48h');
      expect(expiration.toString()).toBe('2d');
    });
  });

  describe('fromEnv', () => {
    const originalEnv = process.env.JWT_EXPIRES_IN;

    afterEach(() => {
      if (originalEnv !== undefined) {
        process.env.JWT_EXPIRES_IN = originalEnv;
      } else {
        delete process.env.JWT_EXPIRES_IN;
      }
    });

    it('should use JWT_EXPIRES_IN from environment', () => {
      process.env.JWT_EXPIRES_IN = '14d';
      const expiration = TokenExpiration.fromEnv();
      expect(expiration.toSeconds()).toBe(14 * 24 * 60 * 60);
    });

    it('should default to 7d when JWT_EXPIRES_IN is not set', () => {
      delete process.env.JWT_EXPIRES_IN;
      const expiration = TokenExpiration.fromEnv();
      expect(expiration.toSeconds()).toBe(7 * 24 * 60 * 60);
    });

    it('should throw when JWT_EXPIRES_IN has invalid format', () => {
      process.env.JWT_EXPIRES_IN = 'invalid';
      expect(() => TokenExpiration.fromEnv()).toThrow('Invalid duration format');
    });
  });

  describe('conversion accuracy', () => {
    it('should maintain precision for toMilliseconds', () => {
      const expiration = TokenExpiration.parse('1s');
      expect(expiration.toMilliseconds()).toBe(1000);
    });

    it('should handle large durations without overflow', () => {
      const expiration = TokenExpiration.parse('365d');
      expect(expiration.toSeconds()).toBe(365 * 24 * 60 * 60);
      expect(expiration.toMilliseconds()).toBe(365 * 24 * 60 * 60 * 1000);
    });
  });
});
