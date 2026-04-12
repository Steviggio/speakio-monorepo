import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({
  path: path.resolve(process.cwd(), '../../.env'),
});
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource, ResourceDocument } from '../src/schemas/resource.schema';
import { ResourceInferenceService } from '../src/resources/services/resource-inference.service';
import { ResourceNormalizerService } from '../src/resources/services/resource-normalizer.service';
import { AppModule } from 'src/app.module';

type CliOptions = {
  dryRun: boolean;
  limit?: number;
  onlyMissing: boolean;
  publishLegacy: boolean;
  batchSize: number;
};

function parseArgs(argv: string[]): CliOptions {
  const args = new Set(argv);

  const getValue = (flag: string): string | undefined => {
    const index = argv.findIndex((arg) => arg === flag);
    if (index === -1) return undefined;
    return argv[index + 1];
  };

  const limitValue = getValue('--limit');
  const batchSizeValue = getValue('--batch-size');

  return {
    dryRun: args.has('--dry-run'),
    onlyMissing: !args.has('--all'),
    publishLegacy: !args.has('--no-publish-legacy'),
    limit: limitValue ? Number(limitValue) : undefined,
    batchSize: batchSizeValue ? Number(batchSizeValue) : 100,
  };
}

function hasMeaningfulPublisher(resource: ResourceDocument | any): boolean {
  return Boolean(resource.publisher?.slug || resource.publisher?.name);
}

function hasMeaningfulSeries(resource: ResourceDocument | any): boolean {
  return Boolean(resource.series?.slug || resource.series?.name);
}

function hasMeaningfulSourcePlatform(
  resource: ResourceDocument | any,
): boolean {
  return Boolean(
    resource.sourcePlatform?.domain &&
    resource.sourcePlatform?.rootDomain &&
    resource.sourcePlatform?.baseUrl &&
    resource.sourcePlatform?.label,
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const resourceModel = app.get<Model<ResourceDocument>>(
      getModelToken(Resource.name),
    );
    const normalizer = app.get(ResourceNormalizerService);
    const inference = app.get(ResourceInferenceService);

    const baseQuery = options.onlyMissing
      ? {
          $or: [
            { canonicalUrl: { $exists: false } },
            { canonicalUrl: '' },
            { sourcePlatform: { $exists: false } },
            { sourcePlatform: null },
            { 'sourcePlatform.domain': { $exists: false } },
            { publisher: { $exists: false } },
            { publisher: null },
            { 'publisher.slug': { $exists: false } },
            { series: { $exists: false } },
            { series: null },
            { 'series.slug': { $exists: false } },
            { sourceMetadata: { $exists: false } },
            { sourceMetadata: null },
            { status: { $exists: false } },
            { status: null },
            { isActive: { $exists: false } },
            { isActive: null },
          ],
        }
      : {};

    const totalToInspect = await resourceModel.countDocuments(baseQuery);

    console.log('--- Backfill resources ---');
    console.log(`Mode dry-run: ${options.dryRun ? 'YES' : 'NO'}`);
    console.log(`Only missing fields: ${options.onlyMissing ? 'YES' : 'NO'}`);
    console.log(
      `Publish legacy resources without status: ${options.publishLegacy ? 'YES' : 'NO'}`,
    );
    console.log(`Batch size: ${options.batchSize}`);
    console.log(`Documents matching query: ${totalToInspect}`);

    const query = resourceModel.find(baseQuery).sort({ createdAt: 1 });

    if (options.limit && Number.isFinite(options.limit)) {
      query.limit(options.limit);
    }

    const docs = await query.exec();

    let inspected = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const bulkOperations: Array<any> = [];

    for (const resource of docs) {
      inspected += 1;

      try {
        const $set: Record<string, any> = {};

        const title = resource.title ?? '';
        const description = resource.description ?? '';
        const url = resource.url ?? '';

        if (!url || typeof url !== 'string') {
          skipped += 1;
          console.warn(
            `[SKIP] Resource ${resource._id.toString()} has no valid URL.`,
          );
          continue;
        }

        const normalized = normalizer.normalizeUrl(url);

        if (
          !resource.canonicalUrl ||
          resource.canonicalUrl !== normalized.canonicalUrl
        ) {
          $set.canonicalUrl = normalized.canonicalUrl;
        }

        if (
          !hasMeaningfulSourcePlatform(resource) ||
          resource.sourcePlatform?.domain !==
            normalized.sourcePlatform.domain ||
          resource.sourcePlatform?.rootDomain !==
            normalized.sourcePlatform.rootDomain ||
          resource.sourcePlatform?.baseUrl !==
            normalized.sourcePlatform.baseUrl ||
          resource.sourcePlatform?.label !== normalized.sourcePlatform.label
        ) {
          $set.sourcePlatform = normalized.sourcePlatform;
        }

        if (!hasMeaningfulPublisher(resource)) {
          const inferredPublisher = inference.inferPublisher(
            title,
            description,
            url,
          );

          if (inferredPublisher) {
            $set.publisher = inferredPublisher;
          }
        }

        if (!hasMeaningfulSeries(resource)) {
          const inferredSeries = inference.inferSeries(title, description);

          if (inferredSeries) {
            $set.series = inferredSeries;
          }
        }

        if (!resource.sourceMetadata) {
          $set.sourceMetadata = {
            origin: 'MANUAL',
          };
        } else if (!resource.sourceMetadata.origin) {
          $set['sourceMetadata.origin'] = 'MANUAL';
        }

        if (resource.isActive === undefined || resource.isActive === null) {
          $set.isActive = true;
        }

        if (
          (resource.status === undefined || resource.status === null) &&
          options.publishLegacy
        ) {
          $set.status = 'PUBLISHED';
        }

        if (
          !resource.authorOrPublisher &&
          ($set.publisher?.name || resource.publisher?.name)
        ) {
          $set.authorOrPublisher =
            $set.publisher?.name ?? resource.publisher?.name ?? null;
        }

        const hasSet = Object.keys($set).length > 0;

        if (!hasSet) {
          skipped += 1;
          continue;
        }

        const updatePayload = { $set };

        if (options.dryRun) {
          updated += 1;
          console.log(
            `[DRY-RUN] ${resource._id.toString()} -> ${JSON.stringify(updatePayload)}`,
          );
        } else {
          bulkOperations.push({
            updateOne: {
              filter: { _id: resource._id },
              update: updatePayload,
            },
          });

          if (bulkOperations.length >= options.batchSize) {
            await resourceModel.bulkWrite(bulkOperations, { ordered: false });
            updated += bulkOperations.length;
            bulkOperations.length = 0;
          }
        }
      } catch (error) {
        failed += 1;
        console.error(
          `[ERROR] Failed on resource ${resource._id.toString()}:`,
          error,
        );
      }
    }

    if (!options.dryRun && bulkOperations.length > 0) {
      await resourceModel.bulkWrite(bulkOperations, { ordered: false });
      updated += bulkOperations.length;
    }

    console.log('--- Backfill summary ---');
    console.log(`Inspected: ${inspected}`);
    console.log(`Updated${options.dryRun ? ' (simulated)' : ''}: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Failed: ${failed}`);
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error('Backfill failed:', error);
  process.exit(1);
});
