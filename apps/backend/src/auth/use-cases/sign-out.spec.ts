import { Test, TestingModule } from '@nestjs/testing';
import { SignOut } from './sign-out';
import { AppLogger } from '../../logger/app-logger';

describe('SignOut', () => {
  let useCase: SignOut;
  let logger: jest.Mocked<AppLogger>;

  beforeEach(async () => {
    const mockLogger = {
      setContext: jest.fn(),
      log: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SignOut, { provide: AppLogger, useValue: mockLogger }],
    }).compile();

    useCase = module.get<SignOut>(SignOut);
    logger = module.get(AppLogger);
  });

  describe('execute', () => {
    it('should clear JWT cookie and return success message', () => {
      const mockResponse = {
        clearCookie: jest.fn(),
      } as any;

      const userId = 'user-id-123';

      const result = useCase.execute(mockResponse, userId);

      expect(result).toEqual({
        message: 'Signed out successfully',
      });

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('jwt', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
      });

      expect(logger.log).toHaveBeenCalledWith(`Signing out user: ${userId}`);
      expect(logger.log).toHaveBeenCalledWith(
        `User signed out successfully: ${userId}`,
      );
    });

    it('should use secure cookie in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockResponse = {
        clearCookie: jest.fn(),
      } as any;

      useCase.execute(mockResponse, 'user-id-prod');

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('jwt', {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
      });

      process.env.NODE_ENV = originalEnv;
    });

    it('should use non-secure cookie in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockResponse = {
        clearCookie: jest.fn(),
      } as any;

      useCase.execute(mockResponse, 'user-id-dev');

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('jwt', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
      });

      process.env.NODE_ENV = originalEnv;
    });
  });
});
