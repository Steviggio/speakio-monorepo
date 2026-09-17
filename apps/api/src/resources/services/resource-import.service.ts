import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource, ResourceDocument } from '../../schemas/resource.schema';
import {
  ResourceImportBatch,
  ResourceImportBatchDocument,
} from '../../schemas/resource-import-batch.schema';
import { ImportResourcesDto } from '../dto/import-resources.dto';
import { ResourceCurationPipeline } from '../curation/resource-curation.pipeline';

@Injectable()
export class ResourceImportService {
  constructor(
    @InjectModel(Resource.name)
    private readonly resourceModel: Model<ResourceDocument>,
    @InjectModel(ResourceImportBatch.name)
    private readonly importBatchModel: Model<ResourceImportBatchDocument>,
    private readonly curationPipeline: ResourceCurationPipeline,
  ) {}

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

        const existingInfo = await this.resourceModel
          .findOne({
            $or: [
              { url: raw.url },
              // In case canonicalUrl matches
              { canonicalUrl: raw.url },
            ],
          })
          .select('status isActive canonicalUrl')
          .lean()
          .exec();

        const curated = this.curationPipeline.curate({
          url: raw.url,
          title: raw.title,
          description: raw.description,
          type: raw.type,
          language: raw.language || dto.language,
          pricing: raw.pricing,
          tags: raw.tags,
          metadata: {
            origin: 'SCRAPING',
            source: dto.source ?? 'playwright',
            importBatchId: batch._id.toString(),
            rawFileName: dto.fileName,
          },
          existing: existingInfo
            ? {
                status: existingInfo.status,
                isActive: existingInfo.isActive,
              }
            : undefined,
        });

        // Also check if canonicalUrl exists if the original query didn't find by raw url
        let existingDoc = existingInfo;
        if (!existingDoc) {
          existingDoc = await this.resourceModel
            .findOne({ canonicalUrl: curated.canonicalUrl })
            .select('status isActive')
            .lean()
            .exec();
        }

        const updateResult = await this.resourceModel
          .findOneAndUpdate(
            { canonicalUrl: curated.canonicalUrl },
            { $set: curated },
            { upsert: true, new: false },
          )
          .exec();

        if (updateResult || existingDoc) {
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
    const safeUrl = typeof item?.url === 'string' ? item.url : '(no url)';

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
