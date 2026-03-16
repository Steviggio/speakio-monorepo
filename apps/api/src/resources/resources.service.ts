import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Resource, ResourceDocument } from '../schemas/resource.schema';
import { CreateResourceDto } from './dto/create-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { QueryResourceDto } from './dto/query-resource.dto';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name)
    private resourceModel: Model<ResourceDocument>,
  ) {}

  async create(
    createDto: CreateResourceDto,
    userId: string,
  ): Promise<ResourceDocument> {
    const resource = new this.resourceModel({
      ...createDto,
      submittedBy: userId,
    });
    return resource.save();
  }

  async findAll(query: QueryResourceDto) {
    const filter: Record<string, any> = {};

    // Full-text search
    if (query.search) {
      filter.$text = { $search: query.search };
    }

    // Filters
    if (query.language) filter.language = query.language;
    if (query.type) filter.type = query.type;
    if (query.pricing) filter.pricing = query.pricing;
    if (query.tag) filter.tags = query.tag;

    // Sort
    let sort: Record<string, SortOrder> = { createdAt: -1 }; // default newest
    if (query.sort === 'oldest') sort = { createdAt: 1 };
    if (query.sort === 'popular') sort = { positiveVotes: -1, createdAt: -1 };

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.resourceModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('submittedBy', 'username avatarUrl')
        .exec(),
      this.resourceModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<ResourceDocument> {
    const resource = await this.resourceModel
      .findById(id)
      .populate('submittedBy', 'username avatarUrl')
      .exec();
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    return resource;
  }

  async update(
    id: string,
    updateDto: UpdateResourceDto,
    userId: string,
    userRole?: string,
  ): Promise<ResourceDocument> {
    const resource = await this.resourceModel.findById(id).exec();
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    if (resource.submittedBy.toString() !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to update this resource');
    }
    Object.assign(resource, updateDto);
    return resource.save();
  }

  async remove(id: string, userId: string, userRole?: string): Promise<{ deleted: boolean }> {
    const resource = await this.resourceModel.findById(id).exec();
    if (!resource) {
      throw new NotFoundException('Resource not found');
    }
    if (resource.submittedBy.toString() !== userId && userRole !== 'ADMIN') {
      throw new ForbiddenException('Not authorized to delete this resource');
    }
    await resource.deleteOne();
    return { deleted: true };
  }

  async incrementVote(
    id: string,
    field: 'positiveVotes' | 'negativeVotes',
    delta: number,
  ): Promise<void> {
    await this.resourceModel
      .findByIdAndUpdate(id, { $inc: { [field]: delta } })
      .exec();
  }
}
