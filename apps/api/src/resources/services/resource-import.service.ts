import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource, ResourceDocument } from '../../schemas/resource.schema';
import {
  ResourceImportBatch,
  ResourceImportBatchDocument,
} from '../../schemas/resource-import-batch.schema';
import { mapImportedResourceToDocument } from '../mappers/resource-import.mapper';
import { ImportResourcesDto } from '../dto/import-resources.dto';
import { ResourceInferenceService } from './resource-inference.service';
import { ResourceNormalizerService } from './resource-normalizer.service';
import { ResourceContentNormalizationService } from './resource-content-normalization.service';
import { ResourceClassificationService } from './resource-classification.service';
import { ResourceQualityService } from './resource-quality.service';

@Injectable()
export class ResourceImportService {
  constructor(
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    @InjectModel(ResourceImportBatch.name)
    private readonly importBatchModel: Model<ResourceImportBatchDocument>,
    private readonly urlNormalizer: ResourceNormalizerService,
    private readonly contentNormalization: ResourceContentNormalizationService,
    private readonly classification: ResourceClassificationService,
    private readonly quality: ResourceQualityService,
    private readonly inference: ResourceInferenceService,
  ) { }

  async importBatch(dto: ImportResourcesDto, importedBy: string) {
    const batch = await this.importBatchModel.create({
      source: dto.source ?? 'playwright',
      fileName: dto.fileName,
      language: dto.language,
      importedBy,
      stats: {
        total: dto.items.length,
        created: 0,
        updated: 0,
        rejected: 0,
      },
    });

    for (let index = 0; index < dto.items.length; index += 1) {
      const item = dto.items[index];

      try {
        const raw = this.buildRawItem(item);
        if (!raw.url) {
          throw new Error('Missing url');
        }

        const normalizedUrl = this.urlNormalizer.normalizeUrl(raw.url);

        const normalized = this.contentNormalization.normalize(
          {
            title: raw.title,
            description: raw.description,
            language: raw.language,
            pricing: raw.pricing,
          },
          dto.language,
        );

        const classification = this.classification.classify({
          rawType: raw.type,
          url: raw.url,
          title: normalized.title,
          description: normalized.description,
        });

        const inferredPublisher = this.inference.inferPublisher(
          normalized.title,
          normalized.description,
          raw.url,
        );

        const inferredSeries = this.inference.inferSeries(
          normalized.title,
          normalized.description,
        );

        const quality = this.quality.compute({
          raw: {
            description: raw.description,
          },
          normalized: {
            title: normalized.title,
            description: normalized.description,
            type: classification.type,
            language: normalized.language,
          },
          sourcePlatformExists: Boolean(normalizedUrl.sourcePlatform),
          inferredPublisherExists: Boolean(inferredPublisher),
          inferredSeriesExists: Boolean(inferredSeries),
        });

        const existingInfo = await this.resourceModel
          .findOne({ canonicalUrl: normalizedUrl.canonicalUrl })
          .select('status isActive')
          .lean()
          .exec();

        const payload = mapImportedResourceToDocument({
          dto,
          raw,
          normalized,
          normalizedUrl,
          classification,
          inferredPublisher,
          inferredSeries,
          quality,
          importBatchId: batch._id.toString(),
          existingStatus: existingInfo?.status as string | undefined,
          existingIsActive: existingInfo?.isActive as boolean | undefined,
        });

        const updateResult = await this.resourceModel.findOneAndUpdate(
          { canonicalUrl: payload.canonicalUrl },
          { $set: payload },
          { upsert: true, new: false }
        ).exec();

        if (updateResult) {
          batch.stats.updated += 1;
        } else {
          batch.stats.created += 1;
        }
      } catch (error) {
        batch.stats.rejected += 1;
        this.logImportError(dto.fileName, index, item, error);
      }
    }

    await batch.save();
    return batch;
  }

  private buildRawItem(item: Record<string, unknown>) {
    return {
      title: this.safeString(item.title),
      description: this.safeString(item.description),
      url: this.safeString(item.url),
      language: this.safeString(item.language),
      type: this.safeString(item.type),
      pricing: this.safeString(item.pricing),
      tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag)) : [],
    };
  }

  private safeString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private logImportError(
    fileName: string,
    index: number,
    item: Record<string, unknown>,
    error: unknown,
  ) {
    const safeTitle =
      typeof item?.title === 'string' ? item.title : '(no title)';
    const safeUrl =
      typeof item?.url === 'string' ? item.url : '(no url)';

    console.error(
      `[RESOURCE IMPORT ERROR] file=${fileName} index=${index} title="${safeTitle}" url="${safeUrl}"`,
    );

    if (error instanceof Error) {
      console.error(error.message);
      if (error.stack) {
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
  }
}