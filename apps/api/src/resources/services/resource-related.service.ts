import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource, ResourceDocument } from '../../schemas/resource.schema';

@Injectable()
export class ResourceRelatedService {
  constructor(
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
  ) {}

  async getRelatedResources(id: string) {
    const resource = await this.resourceModel.findById(id).lean().exec();

    if (!resource) {
      throw new NotFoundException('Resource not found');
    }

    const baseFilter = this.buildPublicFilter();
    const excludedIds: string[] = [String(resource._id)];

    const sameSeriesItems = resource.series?.slug
      ? await this.resourceModel
          .find({
            ...baseFilter,
            _id: { $nin: excludedIds },
            'series.slug': resource.series.slug,
          })
          .sort({ positiveVotes: -1, createdAt: -1 })
          .limit(8)
          .lean()
          .exec()
      : [];

    excludedIds.push(...sameSeriesItems.map((item) => String(item._id)));

    const samePublisherItems = resource.publisher?.slug
      ? await this.resourceModel
          .find({
            ...baseFilter,
            _id: { $nin: excludedIds },
            'publisher.slug': resource.publisher.slug,
          })
          .sort({ positiveVotes: -1, createdAt: -1 })
          .limit(8)
          .lean()
          .exec()
      : [];

    excludedIds.push(...samePublisherItems.map((item) => String(item._id)));

    const samePlatformItems = resource.sourcePlatform?.rootDomain
      ? await this.resourceModel
          .find({
            ...baseFilter,
            _id: { $nin: excludedIds },
            'sourcePlatform.rootDomain': resource.sourcePlatform.rootDomain,
          })
          .sort({ positiveVotes: -1, createdAt: -1 })
          .limit(8)
          .lean()
          .exec()
      : [];

    return {
      sameSeries: {
        type: 'SERIES',
        name: resource.series?.name ?? null,
        slug: resource.series?.slug ?? null,
        items: sameSeriesItems,
      },
      samePublisher: {
        type: 'PUBLISHER',
        name: resource.publisher?.name ?? null,
        slug: resource.publisher?.slug ?? null,
        items: samePublisherItems,
      },
      samePlatform: {
        type: 'PLATFORM',
        name: resource.sourcePlatform?.label ?? null,
        domain: resource.sourcePlatform?.rootDomain ?? null,
        items: samePlatformItems,
      },
    };
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
