import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { Resource, ResourceDocument } from '../schemas/resource.schema';
import { CreateResourceDto } from './dto/create-resource.dto';
import { ImportResourcesDto } from './dto/import-resources.dto';
import { QueryResourcesDto } from './dto/query-resource.dto';
import { UpdateResourceDto } from './dto/update-resource.dto';
import { ResourceImportService } from './services/resource-import.service';
import { ResourceRelatedService } from './services/resource-related.service';
import { ResourceCurationPipeline } from './curation/resource-curation.pipeline';

@Injectable()
export class ResourcesService {
  constructor(
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    private readonly curationPipeline: ResourceCurationPipeline,
    private readonly importService: ResourceImportService,
    private readonly relatedService: ResourceRelatedService,
  ) {}

  async create(
    createDto: CreateResourceDto,
    userId?: string | null,
  ): Promise<ResourceDocument> {
    const curated = this.curationPipeline.curate({
      url: createDto.url,
      title: createDto.title,
      description: createDto.description,
      type: createDto.type,
      language: createDto.language,
      pricing: createDto.pricing,
      tags: createDto.tags,
      levels: createDto.levels,
      formats: createDto.formats,
      publisher: createDto.publisher,
      series: createDto.series,
      status: createDto.status,
      isActive: createDto.isActive,
      metadata: {
        origin: createDto.sourceMetadata?.origin ?? 'MANUAL',
        source: 'manual',
        rawFileName: createDto.sourceMetadata?.rawFileName,
        importBatchId: createDto.sourceMetadata?.importBatchId,
        submittedBy: userId ?? null,
      },
    });

    const existing = await this.resourceModel
      .findOne({ canonicalUrl: curated.canonicalUrl })
      .exec();

    if (existing) {
      return existing;
    }

    const resource = new this.resourceModel({
      ...curated,
      submittedBy: userId ?? null,
      thumbnailUrl: createDto.thumbnailUrl ?? curated.thumbnailUrl,
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

    const [types, pricing, languages, platforms, publishers, series] =
      await Promise.all([
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
          {
            $match: { ...match, language: { $exists: true, $nin: [null, ''] } },
          },
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

    const mergedUrl = updateDto.url ?? resource.url;
    const mergedTitle = updateDto.title ?? resource.title;
    const mergedDescription = updateDto.description ?? resource.description;
    const mergedType = updateDto.type ?? resource.type;
    const mergedLanguage = updateDto.language ?? resource.language;
    const mergedPricing = updateDto.pricing ?? resource.pricing;
    const mergedTags = updateDto.tags ?? resource.tags;
    const mergedLevels = updateDto.levels ?? resource.levels;
    const mergedFormats = updateDto.formats ?? resource.formats;
    const mergedPublisher =
      updateDto.publisher !== undefined
        ? updateDto.publisher
        : resource.publisher;
    const mergedSeries =
      updateDto.series !== undefined ? updateDto.series : resource.series;
    const mergedStatus = updateDto.status ?? resource.status;
    const mergedIsActive = updateDto.isActive ?? resource.isActive;

    const curated = this.curationPipeline.curate({
      url: mergedUrl,
      title: mergedTitle,
      description: mergedDescription,
      type: mergedType,
      language: mergedLanguage,
      pricing: mergedPricing,
      tags: mergedTags,
      levels: mergedLevels,
      formats: mergedFormats,
      publisher: mergedPublisher,
      series: mergedSeries,
      status: mergedStatus,
      isActive: mergedIsActive,
      metadata: {
        origin:
          updateDto.sourceMetadata?.origin ??
          resource.sourceMetadata?.origin ??
          'MANUAL',
        rawFileName:
          updateDto.sourceMetadata?.rawFileName ??
          resource.sourceMetadata?.rawFileName,
        importBatchId:
          updateDto.sourceMetadata?.importBatchId ??
          resource.sourceMetadata?.importBatchId,
      },
    });

    Object.assign(resource, updateDto);

    resource.canonicalUrl = curated.canonicalUrl;
    if (!updateDto.sourcePlatform) {
      resource.sourcePlatform = curated.sourcePlatform as any;
    }
    resource.publisher = curated.publisher as any;
    resource.series = curated.series as any;
    resource.quality = curated.quality as any;
    if (!updateDto.status) {
      resource.status = curated.status as any;
    }
    if (!resource.sourceMetadata) {
      resource.sourceMetadata = {
        origin: 'MANUAL',
      } as any;
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
