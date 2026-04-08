import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Resource, ResourceDocument } from '../schemas/resource.schema';
import { CreateResourceDto } from './dto/create-resource.dto';
import { ImportResourcesDto } from './dto/import-resources.dto';
import { QueryResourcesDto } from './dto/query-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceImportService } from './services/resource-import.service';
import { ResourceInferenceService } from './services/resource-inference.service';
import { ResourceNormalizerService } from './services/resource-normalizer.service';
import { ResourceRelatedService } from './services/resource-related.service';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    private readonly normalizer: ResourceNormalizerService,
    private readonly inference: ResourceInferenceService,
    private readonly importService: ResourceImportService,
    private readonly relatedService: ResourceRelatedService,
  ) { }

  async create(
    createDto: CreateResourceDto,
    userId?: string | null,
  ): Promise<ResourceDocument> {
    const normalized = this.normalizer.normalizeUrl(createDto.url);

    const existing = await this.resourceModel
      .findOne({ canonicalUrl: normalized.canonicalUrl })
      .exec();

    if (existing) {
      return existing;
    }

    const publisher =
      createDto.publisher ??
      this.inference.inferPublisher(
        createDto.title,
        createDto.description,
        createDto.url,
      );

    const series =
      createDto.series ??
      this.inference.inferSeries(createDto.title, createDto.description);

    const resource = new this.resourceModel({
      ...createDto,
      tags: createDto.tags ?? [],
      canonicalUrl: normalized.canonicalUrl,
      sourcePlatform: createDto.sourcePlatform ?? normalized.sourcePlatform,
      publisher,
      series,
      status: createDto.status ?? 'REVIEW',
      isActive: createDto.isActive ?? true,
      sourceMetadata: createDto.sourceMetadata ?? {
        origin: 'MANUAL',
      },
      submittedBy: userId ?? null,
    });

    return resource.save();
  }

  async findAll(query: QueryResourcesDto) {
    const filter: Record<string, any> = this.buildPublicFilter();

    if (query.search) {
      filter.$text = { $search: query.search };
    }

    if (query.language) filter.language = query.language;
    if (query.type) filter.type = query.type;
    if (query.pricing) filter.pricing = query.pricing;
    if (query.providerDomain) {
      filter['sourcePlatform.rootDomain'] = query.providerDomain;
    }
    if (query.publisherSlug) filter['publisher.slug'] = query.publisherSlug;
    if (query.seriesSlug) filter['series.slug'] = query.seriesSlug;

    let sort: Record<string, SortOrder> = { createdAt: -1 };

    if (query.sort === 'oldest') {
      sort = { createdAt: 1 };
    } else if (query.sort === 'popular') {
      sort = { positiveVotes: -1, createdAt: -1 };
    } else if (query.search) {
      sort = { score: { $meta: 'textScore' } as unknown as SortOrder };
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 12;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.resourceModel
        .find(filter)
        .select('-raw -enrichment')
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

  async getFacets(query: QueryResourcesDto) {
    const match: Record<string, any> = this.buildPublicFilter();

    if (query.language) match.language = query.language;
    if (query.type) match.type = query.type;
    if (query.pricing) match.pricing = query.pricing;

    const [types, pricing, languages, platforms, publishers, series] = await Promise.all([
      this.resourceModel.aggregate([
        { $match: match },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.resourceModel.aggregate([
        { $match: match },
        { $group: { _id: '$pricing', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.resourceModel.aggregate([
        { $match: { ...match, language: { $exists: true, $ne: null, $ne: '' } } },
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      this.resourceModel.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$sourcePlatform.rootDomain',
            label: { $first: '$sourcePlatform.label' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      this.resourceModel.aggregate([
        {
          $match: {
            ...match,
            'publisher.slug': { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$publisher.slug',
            name: { $first: '$publisher.name' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
      this.resourceModel.aggregate([
        {
          $match: {
            ...match,
            'series.slug': { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: '$series.slug',
            name: { $first: '$series.name' },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 20 },
      ]),
    ]);

    return {
      types,
      pricing,
      languages,
      platforms,
      publishers,
      series,
    };
  }

  async findById(id: string): Promise<ResourceDocument> {
    const resource = await this.resourceModel
      .findOne({
        ...this.buildPublicFilter(),
        _id: id,
      })
      .populate('submittedBy', 'username avatarUrl')
      .exec();

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  async getRelatedResources(id: string) {
    return this.relatedService.getRelatedResources(id);
  }

  async update(
    id: string,
    updateDto: UpdateResourceDto,
    _userId?: string,
    _userRole?: string,
  ): Promise<ResourceDocument> {
    const resource = await this.resourceModel.findById(id).exec();

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    Object.assign(resource, updateDto);

    if (resource.url) {
      const normalized = this.normalizer.normalizeUrl(resource.url);

      resource.canonicalUrl = normalized.canonicalUrl;

      if (!updateDto.sourcePlatform) {
        resource.sourcePlatform = normalized.sourcePlatform as any;
      }
    }

    if (!resource.sourceMetadata) {
      resource.sourceMetadata = {
        origin: 'MANUAL',
      } as any;
    }

    if (!updateDto.publisher && (!resource.publisher?.slug || !resource.publisher?.name)) {
      resource.publisher = this.inference.inferPublisher(
        resource.title,
        resource.description,
        resource.url,
      ) as any;
    }

    if (!updateDto.series && (!resource.series?.slug || !resource.series?.name)) {
      resource.series = this.inference.inferSeries(
        resource.title,
        resource.description,
      ) as any;
    }

    return resource.save();
  }

  async remove(
    id: string,
    _userId?: string,
    _userRole?: string,
  ): Promise<{ deleted: boolean; archived: boolean }> {
    const resource = await this.resourceModel.findById(id).exec();

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    resource.status = 'ARCHIVED';
    resource.isActive = false;
    await resource.save();

    return { deleted: false, archived: true };
  }

  async publish(id: string): Promise<ResourceDocument> {
    const resource = await this.resourceModel
      .findByIdAndUpdate(
        id,
        {
          status: 'PUBLISHED',
          isActive: true,
        },
        { new: true },
      )
      .exec();

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
  }

  async archive(id: string): Promise<ResourceDocument> {
    const resource = await this.resourceModel
      .findByIdAndUpdate(
        id,
        {
          status: 'ARCHIVED',
          isActive: false,
        },
        { new: true },
      )
      .exec();

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    return resource;
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

  async importBatch(dto: ImportResourcesDto, importedBy: string) {
    return this.importService.importBatch(dto, importedBy);
  }

  private buildPublicFilter(): Record<string, unknown> {
    return {
      isActive: { $ne: false },
      $or: [
        { status: 'PUBLISHED' },
        { status: { $exists: false } },
        { status: null },
      ],
    };
  }
}