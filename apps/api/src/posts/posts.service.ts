import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post, PostDocument } from '../schemas/post.schema';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  private generateSlug(title: string): string {
    return (
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() +
      '-' +
      Date.now().toString(36)
    );
  }

  async create(
    createDto: CreatePostDto,
    userId: string,
  ): Promise<PostDocument> {
    const slug = this.generateSlug(createDto.title);
    const post = new this.postModel({
      ...createDto,
      slug,
      author: userId,
    });
    return post.save();
  }

  async findAllPublished(query: PaginationDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.postModel
        .find({ status: 'published' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'username avatarUrl')
        .exec(),
      this.postModel.countDocuments({ status: 'published' }).exec(),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string): Promise<PostDocument> {
    const post = await this.postModel
      .findOne({ slug, status: 'published' })
      .populate('author', 'username avatarUrl')
      .exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async findById(id: string): Promise<PostDocument> {
    const post = await this.postModel
      .findById(id)
      .populate('author', 'username avatarUrl')
      .exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async findMyPosts(userId: string): Promise<PostDocument[]> {
    return this.postModel
      .find({ author: userId })
      .sort({ updatedAt: -1 })
      .exec();
  }

  async update(
    id: string,
    updateDto: UpdatePostDto,
    userId: string,
  ): Promise<PostDocument> {
    const post = await this.postModel.findById(id).exec();
    if (!post) throw new NotFoundException('Post not found');
    if (post.author.toString() !== userId) {
      throw new ForbiddenException('Not authorized to edit this post');
    }

    // Regenerate slug if title changed
    if (updateDto.title && updateDto.title !== post.title) {
      Object.assign(post, updateDto, {
        slug: this.generateSlug(updateDto.title),
      });
    } else {
      Object.assign(post, updateDto);
    }
    return post.save();
  }

  async remove(id: string, userId: string): Promise<{ deleted: boolean }> {
    const post = await this.postModel.findById(id).exec();
    if (!post) throw new NotFoundException('Post not found');
    if (post.author.toString() !== userId) {
      throw new ForbiddenException('Not authorized to delete this post');
    }
    await post.deleteOne();
    return { deleted: true };
  }
}
