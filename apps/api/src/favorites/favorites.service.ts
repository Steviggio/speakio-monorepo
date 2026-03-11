import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class FavoritesService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  /** Toggle favorite: add if not present, remove if already present */
  async toggle(userId: string, resourceId: string) {
    const user = await this.userModel.findById(userId).select('favoriteResources').exec();
    if (!user) throw new NotFoundException('User not found');

    const resObjId = new Types.ObjectId(resourceId);
    const isFavorited = user.favoriteResources.some(
      (id) => id.toString() === resourceId,
    );

    if (!isFavorited) {
      // Use atomic $addToSet to avoid full document validation on .save()
      await this.userModel.findByIdAndUpdate(userId, {
        $addToSet: { favoriteResources: resObjId },
      }).exec();
      return { action: 'added', resourceId };
    } else {
      await this.userModel.findByIdAndUpdate(userId, {
        $pull: { favoriteResources: resObjId },
      }).exec();
      return { action: 'removed', resourceId };
    }
  }

  /** List user's favorite resources with full resource data */
  async listFavorites(userId: string) {
    const user = await this.userModel
      .findById(userId)
      .populate({
        path: 'favoriteResources',
        model: 'Resource',
        populate: { path: 'submittedBy', select: 'username avatarUrl' },
      })
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user.favoriteResources;
  }

  async addFavorite(userId: string, resourceId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { favoriteResources: new Types.ObjectId(resourceId) } },
        { new: true },
      )
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async removeFavorite(
    userId: string,
    resourceId: string,
  ): Promise<UserDocument> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { favoriteResources: new Types.ObjectId(resourceId) } },
        { new: true },
      )
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
