import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetMe } from './get-me';
import { UsersRepository } from '../infra/users.repository';
import { AppLogger } from '../../logger/app-logger';

describe('GetMe', () => {
  let useCase: GetMe;
  let repository: jest.Mocked<UsersRepository>;
  let logger: jest.Mocked<AppLogger>;

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
    };

    const mockLogger = {
      setContext: jest.fn(),
      log: jest.fn(),
      warn: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetMe,
        { provide: UsersRepository, useValue: mockRepository },
        { provide: AppLogger, useValue: mockLogger },
      ],
    }).compile();

    useCase = module.get<GetMe>(GetMe);
    repository = module.get(UsersRepository);
    logger = module.get(AppLogger);
  });

  describe('execute', () => {
    it('should return user DTO when user exists', async () => {
      const userId = 'user-id-123';
      const mockUser = {
        id: userId,
        googleId: 'google-id-123',
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
      };

      repository.findById.mockResolvedValue(mockUser);

      const result = await useCase.execute(userId);

      expect(result).toEqual({
        id: userId,
        email: 'user@example.com',
        name: 'John Doe',
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
      expect(repository.findById).toHaveBeenCalledWith(userId);
      expect(logger.log).toHaveBeenCalledWith(`Fetching user: ${userId}`);
      expect(logger.log).toHaveBeenCalledWith(`User fetched successfully: ${userId}`);
    });

    it('should return user DTO with null name', async () => {
      const userId = 'user-id-456';
      const mockUser = {
        id: userId,
        googleId: 'google-id-456',
        email: 'user@example.com',
        name: null,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
      };

      repository.findById.mockResolvedValue(mockUser);

      const result = await useCase.execute(userId);

      expect(result.name).toBeNull();
    });

    it('should throw NotFoundException when user does not exist', async () => {
      const userId = 'non-existent-user';
      repository.findById.mockResolvedValue(null);

      await expect(useCase.execute(userId)).rejects.toThrow(NotFoundException);
      await expect(useCase.execute(userId)).rejects.toThrow('User not found');

      expect(logger.warn).toHaveBeenCalledWith(`User not found: ${userId}`);
      expect(repository.findById).toHaveBeenCalledWith(userId);
    });

    it('should not include googleId in DTO', async () => {
      const userId = 'user-id-789';
      const mockUser = {
        id: userId,
        googleId: 'google-id-789',
        email: 'user@example.com',
        name: 'Jane Smith',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      repository.findById.mockResolvedValue(mockUser);

      const result = await useCase.execute(userId);

      expect(result).not.toHaveProperty('googleId');
      expect(Object.keys(result)).toEqual(['id', 'email', 'name', 'createdAt', 'updatedAt']);
    });
  });
});
