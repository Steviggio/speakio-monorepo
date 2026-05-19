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
import { paginate } from '../common/helpers/paginate.helper';

@Injectable()
export class PostsService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  // Generates a URL-safe slug from the post title with a unique timestamp suffix.
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

  // Creates a blog post with an auto-generated slug and the author set.
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

  // Returns published posts sorted by newest, with author populated.
  async findAllPublished(query: PaginationDto) {
    return paginate(this.postModel, { status: 'published' }, query, {
      sort: { createdAt: -1 },
      populate: { path: 'author', select: 'username avatarUrl' },
    });
  }

  // Fetches a single published post by its URL slug.
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

  async findMyPosts(userId: string, query: PaginationDto) {
    return paginate(this.postModel, { author: userId }, query, {
      sort: { updatedAt: -1 },
    });
  }

  // Updates a post; regenerates the slug if the title changed.
  async update(
    id: string,
    updateDto: UpdatePostDto,
    userId: string,
    userRole?: string,
  ): Promise<PostDocument> {
    const post = await this.postModel.findById(id).exec();
    if (!post) throw new NotFoundException('Post not found');
    if (userRole !== 'ADMIN' && post.author.toString() !== userId) {
      throw new ForbiddenException('Not authorized to edit this post');
    }

    if (updateDto.title && updateDto.title !== post.title) {
      Object.assign(post, updateDto, {
        slug: this.generateSlug(updateDto.title),
      });
    } else {
      Object.assign(post, updateDto);
    }
    return post.save();
  }

  // Deletes a post after verifying ownership or admin role.
  async remove(
    id: string,
    userId: string,
    userRole?: string,
  ): Promise<{ deleted: boolean }> {
    const post = await this.postModel.findById(id).exec();
    if (!post) throw new NotFoundException('Post not found');
    if (userRole !== 'ADMIN' && post.author.toString() !== userId) {
      throw new ForbiddenException('Not authorized to delete this post');
    }
    await post.deleteOne();
    return { deleted: true };
  }
}
