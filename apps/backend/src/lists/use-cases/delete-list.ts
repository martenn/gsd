import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { List } from '@prisma/client';
import { ListsRepository } from '../infra/lists.repository';
import { ColorPool } from '../../colors/color-pool';

@Injectable()
export class DeleteList {
  constructor(
    private readonly repository: ListsRepository,
    private readonly colorPool: ColorPool,
  ) {}

  async execute(userId: string, listId: string, destListId?: string): Promise<void> {
    const list = await this.repository.findById(listId, userId);
    await this.checkPrerequisites(list, userId);

    const destination = await this.resolveDestination(userId, listId, destListId);
    // TODO where should this be done? now it's DB level, but maybe we should make it on domain level and then persist
    await this.repository.deleteWithTaskMove(listId, destination.id, userId);

    // TODO maybe move the check into color pool, like release when possible
    if (list?.color) {
      this.colorPool.releaseColor(list.color as any);
    }
  }

  private async checkPrerequisites(
    list: {
      name: string;
      id: string;
      orderIndex: number;
      isBacklog: boolean;
      isDone: boolean;
      color: string | null;
      userId: string;
      createdAt: Date;
      updatedAt: Date;
    } | null,
    userId: string,
  ) {
    if (!list) throw new NotFoundException('List not found');

    if (list.isDone) {
      throw new BadRequestException('Cannot delete Done list');
    }

    await this.ensureBacklogConstraint(list, userId);
  }

  private async ensureBacklogConstraint(list: List, userId: string): Promise<void> {
    if (list.isBacklog) {
      const backlogCount = await this.repository.countBacklogs(userId);

      if (backlogCount <= 1) {
        const intermediate = await this.repository.findFirstIntermediate(userId);

        if (intermediate) {
          await this.repository.promoteToBacklog(intermediate.id);
        } else {
          throw new BadRequestException(
            'Cannot delete last backlog with no intermediate lists to promote',
          );
        }
      }
    }
  }

  private async resolveDestination(
    userId: string,
    listId: string,
    destListId?: string,
  ): Promise<List> {
    if (destListId) {
      return this.validateExplicitDestination(destListId, listId, userId);
    }

    const intermediate = await this.repository.findFirstIntermediate(userId);
    if (intermediate && intermediate.id !== listId) {
      return intermediate;
    }

    const backlog = await this.repository.findFirstBacklog(userId);
    if (!backlog) {
      throw new Error('No backlog found');
    }
    if (backlog.id === listId) {
      const allLists = await this.repository.findManyByUserId(userId, false);
      const otherBacklog = allLists.find((l) => l.isBacklog && l.id !== listId);
      if (!otherBacklog) {
        throw new Error('No alternative destination found');
      }
      return otherBacklog;
    }

    return backlog;
  }

  private async validateExplicitDestination(
    destListId: string,
    listId: string,
    userId: string,
  ): Promise<List> {
    const dest = await this.repository.findById(destListId, userId);

    if (!dest) {
      throw new NotFoundException('Destination list not found');
    }
    if (dest.isDone) {
      throw new BadRequestException('Cannot move tasks to Done list');
    }
    if (dest.id === listId) {
      throw new BadRequestException('Cannot move tasks to same list');
    }

    return dest;
  }
}
