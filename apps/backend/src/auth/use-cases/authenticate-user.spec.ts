import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticateUser } from './authenticate-user';
import { UsersRepository } from '../infra/users.repository';
import { AppLogger } from '../../logger/app-logger';
import { GoogleProfile } from '../dto/google-profile.dto';

describe('AuthenticateUser', () => {
  let useCase: AuthenticateUser;
  let repository: jest.Mocked<UsersRepository>;
  let logger: jest.Mocked<AppLogger>;

  beforeEach(async () => {
    const mockRepository = {
      upsertByGoogleId: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthenticateUser,
        { provide: UsersRepository, useValue: mockRepository },
        { provide: AppLogger, useValue: mockLogger },
      ],
    }).compile();

    useCase = module.get<AuthenticateUser>(AuthenticateUser);
    repository = module.get(UsersRepository);
    logger = module.get(AppLogger);
  });

  describe('execute', () => {
    it('should authenticate user with complete Google profile', async () => {
      const profile: GoogleProfile = {
        id: 'google-id-123',
        emails: [{ value: 'user@example.com', verified: true }],
        displayName: 'John Doe',
      };

      const mockUser = {
        id: 'user-id-123',
        googleId: 'google-id-123',
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.upsertByGoogleId.mockResolvedValue(mockUser);

      const result = await useCase.execute(profile);

      expect(result).toEqual(mockUser);
      expect(repository.upsertByGoogleId).toHaveBeenCalledWith({
        googleId: 'google-id-123',
        email: 'user@example.com',
        name: 'John Doe',
      });
      expect(logger.log).toHaveBeenCalledWith(
        'Authenticating user with Google ID: google-id-123',
      );
      expect(logger.log).toHaveBeenCalledWith(
        'User authenticated successfully: user-id-123 (user@example.com)',
      );
    });

    it('should authenticate user with name constructed from givenName and familyName', async () => {
      const profile: GoogleProfile = {
        id: 'google-id-456',
        emails: [{ value: 'jane@example.com' }],
        name: {
          givenName: 'Jane',
          familyName: 'Smith',
        },
      };

      const mockUser = {
        id: 'user-id-456',
        googleId: 'google-id-456',
        email: 'jane@example.com',
        name: 'Jane Smith',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.upsertByGoogleId.mockResolvedValue(mockUser);

      const result = await useCase.execute(profile);

      expect(result).toEqual(mockUser);
      expect(repository.upsertByGoogleId).toHaveBeenCalledWith({
        googleId: 'google-id-456',
        email: 'jane@example.com',
        name: 'Jane Smith',
      });
    });

    it('should authenticate user with null name when no name provided', async () => {
      const profile: GoogleProfile = {
        id: 'google-id-789',
        emails: [{ value: 'noname@example.com' }],
      };

      const mockUser = {
        id: 'user-id-789',
        googleId: 'google-id-789',
        email: 'noname@example.com',
        name: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.upsertByGoogleId.mockResolvedValue(mockUser);

      const result = await useCase.execute(profile);

      expect(result).toEqual(mockUser);
      expect(repository.upsertByGoogleId).toHaveBeenCalledWith({
        googleId: 'google-id-789',
        email: 'noname@example.com',
        name: null,
      });
    });

    it('should throw error when email is missing from Google profile', async () => {
      const profile: GoogleProfile = {
        id: 'google-id-invalid',
        emails: [],
      };

      await expect(useCase.execute(profile)).rejects.toThrow(
        'Google profile must include email',
      );

      expect(logger.error).toHaveBeenCalled();
      expect(repository.upsertByGoogleId).not.toHaveBeenCalled();
    });

    it('should log and re-throw repository errors', async () => {
      const profile: GoogleProfile = {
        id: 'google-id-error',
        emails: [{ value: 'error@example.com' }],
        displayName: 'Error User',
      };

      const error = new Error('Database connection failed');
      repository.upsertByGoogleId.mockRejectedValue(error);

      await expect(useCase.execute(profile)).rejects.toThrow(
        'Database connection failed',
      );

      expect(logger.error).toHaveBeenCalled();
    });
  });
});
