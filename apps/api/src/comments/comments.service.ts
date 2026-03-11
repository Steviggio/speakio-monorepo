import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Comment, CommentDocument } from '../schemas/comment.schema';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
  ) {}

  async create(
    createDto: CreateCommentDto,
    userId: string,
  ): Promise<CommentDocument> {
    const comment = new this.commentModel({
      ...createDto,
      author: userId,
    });
    return (await comment.save()).populate('author', 'username avatarUrl');
  }

  async findByTarget(targetType: 'Resource' | 'Post', targetId: string) {
    return this.commentModel
      .find({ targetType, targetId })
      .sort({ createdAt: -1 })
      .populate('author', 'username avatarUrl')
      .exec();
  }

  async remove(
    commentId: string,
    userId: string,
  ): Promise<{ deleted: boolean }> {
    const comment = await this.commentModel.findById(commentId).exec();
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.author.toString() !== userId) {
      throw new ForbiddenException('Not authorized to delete this comment');
    }
    await comment.deleteOne();
    return { deleted: true };
  }
}
