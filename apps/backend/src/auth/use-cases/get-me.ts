import { Injectable, NotFoundException } from '@nestjs/common';
import { UserDto } from '@gsd/types';
import { User } from '@prisma/client';
import { UsersRepository } from '../infra/users.repository';
import { AppLogger } from '../../logger/app-logger';

@Injectable()
export class GetMe {
  constructor(
    private readonly repository: UsersRepository,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(GetMe.name);
  }

  async execute(userId: string): Promise<UserDto> {
    this.logger.log(`Fetching user: ${userId}`);

    const user = await this.repository.findById(userId);

    if (!user) {
      this.logger.warn(`User not found: ${userId}`);
      throw new NotFoundException('User not found');
    }

    this.logger.log(`User fetched successfully: ${user.id}`);

    return this.toDto(user);
  }

  private toDto(user: User): UserDto {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
