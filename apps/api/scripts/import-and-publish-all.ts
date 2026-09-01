

const path = require('path');
const fs = require('fs/promises');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(process.cwd(), '../../.env'),
});

import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResourcesService } from '../src/resources/resources.service';
import { Resource, ResourceDocument } from '../src/schemas/resource.schema';
import { AppModule } from '../src/app.module';

type CliOptions = {
  dirPath: string;
  source: string;
  importedBy: string;
  skipImport: boolean;
  skipPublish: boolean;
  limit?: number;
};

function parseArgs(argv: string[]): CliOptions {
  const getValue = (flag: string): string | undefined => {
    const index = argv.findIndex((arg) => arg === flag);
    if (index === -1) return undefined;
    return argv[index + 1];
  };

  const dirPath = getValue('--dir');
  if (!dirPath) {
    throw new Error(
      'Usage: npx ts-node scripts/import-and-publish-all.ts --dir <path> [--source playwright] [--importedBy system] [--skip-import] [--skip-publish] [--limit 10]',
    );
  }

  const limitValue = getValue('--limit');

  return {
    dirPath,
    source: getValue('--source') ?? 'playwright',
    importedBy: getValue('--importedBy') ?? 'system',
    skipImport: argv.includes('--skip-import'),
    skipPublish: argv.includes('--skip-publish'),
    limit: limitValue ? Number(limitValue) : undefined,
  };
}

function inferLanguageFromFileName(fileName: string): string {
  return path.basename(fileName, path.extname(fileName)).toLowerCase();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractItemsFromGroupedArray(
  arr: unknown[],
): Record<string, unknown>[] | null {
  const allObjects = arr.every((item) => isPlainObject(item));
  if (!allObjects) return null;

  const grouped = arr as Record<string, unknown>[];
  const hasResourcesArrays = grouped.some((item) =>
    Array.isArray(item.resources),
  );
  if (!hasResourcesArrays) return null;

  return grouped.flatMap((item) =>
    Array.isArray(item.resources)
      ? (item.resources as Record<string, unknown>[])
      : [],
  );
}

function extractResourceItems(
  parsed: unknown,
  fileName: string,
): Record<string, unknown>[] {
  if (Array.isArray(parsed)) {
    const flattenedGrouped = extractItemsFromGroupedArray(parsed);
    if (flattenedGrouped) return flattenedGrouped;
    return parsed as Record<string, unknown>[];
  }

  if (!isPlainObject(parsed)) {
    throw new Error(
      `Unsupported JSON structure in ${fileName}: expected array or object.`,
    );
  }

  const directArrayKeys = ['resources', 'items', 'data', 'results'];

  for (const key of directArrayKeys) {
    if (Array.isArray(parsed[key])) {
      const value = parsed[key] as unknown[];
      const flattenedGrouped = extractItemsFromGroupedArray(value);
      if (flattenedGrouped) return flattenedGrouped;
      return value as Record<string, unknown>[];
    }
  }

  throw new Error(
    `Unsupported JSON structure in ${fileName}: expected an array, or an object containing one of [resources, items, data, results]. Found keys: ${Object.keys(parsed).join(', ')}`,
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   Speakio — Import & Publish All Language Resources ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log();

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const resourcesService = app.get(ResourcesService);
    const resourceModel = app.get<Model<ResourceDocument>>(
      getModelToken(Resource.name),
    );

    if (!options.skipImport) {
      console.log('┌─ Phase 1: IMPORT ──────────────────────────────────┐');

      const absoluteDir = path.resolve(process.cwd(), options.dirPath);
      const entries = await fs.readdir(absoluteDir);

      let files = entries
        .filter((file: string) => file.endsWith('.json'))
        .sort((a: string, b: string) => a.localeCompare(b));

      if (options.limit && Number.isFinite(options.limit)) {
        files = files.slice(0, options.limit);
      }

      console.log(`│  Fichiers JSON détectés: ${files.length}`);
      console.log(`│  Source: ${options.source}`);
      console.log(`│  MongoDB URI: ${process.env.MONGODB_URI ?? '(default)'}`);
      console.log('│');

      let totalCreated = 0;
      let totalUpdated = 0;
      let totalRejected = 0;
      let totalResources = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const absolutePath = path.join(absoluteDir, file);
        const raw = await fs.readFile(absolutePath, 'utf-8');
        const parsed = JSON.parse(raw);

        const items = extractResourceItems(parsed, file);
        const language = inferLanguageFromFileName(file);
        totalResources += items.length;

        const result = await resourcesService.importBatch(
          {
            language,
            fileName: file,
            source: options.source,
            items,
          },
          options.importedBy,
        );

        const created = result.stats?.created ?? 0;
        const updated = result.stats?.updated ?? 0;
        const rejected = result.stats?.rejected ?? 0;

        totalCreated += created;
        totalUpdated += updated;
        totalRejected += rejected;

        const progress = `[${String(i + 1).padStart(3)}/${files.length}]`;
        console.log(
          `│  ${progress} ${file.padEnd(40)} → +${created} ↻${updated} ✗${rejected}`,
        );
      }

      console.log('│');
      console.log(`│  ═══ Résumé de l'import ═══`);
      console.log(`│  Total ressources traitées: ${totalResources}`);
      console.log(`│  Créées: ${totalCreated}`);
      console.log(`│  Mises à jour: ${totalUpdated}`);
      console.log(`│  Rejetées: ${totalRejected}`);
      console.log('└────────────────────────────────────────────────────┘');
      console.log();
    }

    if (!options.skipPublish) {
      console.log('┌─ Phase 2: PUBLISH ─────────────────────────────────┐');

      const reviewDocs = await resourceModel
        .find({ status: 'REVIEW' })
        .select('_id')
        .exec();

      if (reviewDocs.length === 0) {
        console.log('│  Aucune ressource en REVIEW à publier.');
      } else {
        const ids = reviewDocs.map((doc) => doc._id);

        const result = await resourceModel.updateMany(
          { _id: { $in: ids } },
          {
            $set: {
              status: 'PUBLISHED',
              isActive: true,
            },
          },
        );

        console.log(
          `│  Ressources publiées: ${result.modifiedCount ?? reviewDocs.length}`,
        );
      }

      const publishedCount = await resourceModel.countDocuments({
        status: 'PUBLISHED',
      });
      const totalCount = await resourceModel.countDocuments();

      console.log(`│  Total en BD: ${totalCount}`);
      console.log(`│  Total PUBLISHED: ${publishedCount}`);
      console.log('└────────────────────────────────────────────────────┘');
    }

    console.log();
    console.log('✅ Terminé avec succès !');
  } finally {
    await app.close();
  }
}

main().catch((error) => {
  console.error('❌ Échec:', error);
  process.exit(1);
});
