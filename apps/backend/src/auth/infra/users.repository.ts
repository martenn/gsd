import { Injectable } from '@nestjs/common';
import { PrismaClient, User } from '@prisma/client';

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { googleId },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: {
    googleId: string;
    email: string;
    name?: string | null;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        googleId: data.googleId,
        email: data.email,
        name: data.name ?? null,
      },
    });
  }

  async upsertByGoogleId(data: {
    googleId: string;
    email: string;
    name?: string | null;
  }): Promise<User> {
    return this.prisma.user.upsert({
      where: { googleId: data.googleId },
      create: {
        googleId: data.googleId,
        email: data.email,
        name: data.name ?? null,
      },
      update: {
        email: data.email,
        name: data.name ?? null,
      },
    });
  }
}
