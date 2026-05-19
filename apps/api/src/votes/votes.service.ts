import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vote, VoteDocument } from '../schemas/vote.schema';
import { ResourcesService } from '../resources/resources.service';

@Injectable()
export class VotesService {
  constructor(
    @InjectModel(Vote.name) private voteModel: Model<VoteDocument>,
    private readonly resourcesService: ResourcesService,
  ) {}

  /**
   * Toggle a vote on a resource.
   * - If the user hasn't voted → create vote & increment counter
   * - If the user voted the same type → remove vote & decrement counter (toggle off)
   * - If the user voted a different type → switch vote type, adjust both counters
   */
  async toggleVote(
    userId: string,
    resourceId: string,
    type: 'positive' | 'negative',
  ) {
    const existing = await this.voteModel
      .findOne({ user: userId, resource: resourceId })
      .exec();

    if (!existing) {
      await this.voteModel.create({
        user: userId,
        resource: resourceId,
        type,
      });
      const field = type === 'positive' ? 'positiveVotes' : 'negativeVotes';
      await this.resourcesService.incrementVote(resourceId, field, 1);
      return { action: 'voted', type };
    }

    if (existing.type === type) {
      await existing.deleteOne();
      const field = type === 'positive' ? 'positiveVotes' : 'negativeVotes';
      await this.resourcesService.incrementVote(resourceId, field, -1);
      return { action: 'removed', type };
    }

    const oldField =
      existing.type === 'positive' ? 'positiveVotes' : 'negativeVotes';
    const newField = type === 'positive' ? 'positiveVotes' : 'negativeVotes';
    existing.type = type;
    await existing.save();
    await this.resourcesService.incrementVote(resourceId, oldField, -1);
    await this.resourcesService.incrementVote(resourceId, newField, 1);
    return { action: 'switched', type };
  }

  // Returns the current user's existing vote on a resource, if any.
  async getUserVote(
    userId: string,
    resourceId: string,
  ): Promise<VoteDocument | null> {
    return this.voteModel
      .findOne({ user: userId, resource: resourceId })
      .exec();
  }
}
