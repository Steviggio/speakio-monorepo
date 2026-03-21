const path = require('path');
const fs = require('fs/promises');
const dotenv = require('dotenv');

dotenv.config({
    path: path.resolve(process.cwd(), '../../.env'),
});

import { NestFactory } from '@nestjs/core';
import { ResourcesService } from '../src/resources/resources.service';
import { AppModule } from "../src/app.module"

type CliOptions = {
    dirPath: string;
    source: string;
    importedBy: string;
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
            'Usage: npx ts-node scripts/import-language-folder.ts --dir <path> [--source playwright] [--importedBy system] [--limit 10]',
        );
    }

    const limitValue = getValue('--limit');

    return {
        dirPath,
        source: getValue('--source') ?? 'playwright',
        importedBy: getValue('--importedBy') ?? 'system',
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
    const hasResourcesArrays = grouped.some((item) => Array.isArray(item.resources));
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
        if (flattenedGrouped) {
            return flattenedGrouped;
        }

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
            if (flattenedGrouped) {
                return flattenedGrouped;
            }
            return value as Record<string, unknown>[];
        }
    }

    throw new Error(
        `Unsupported JSON structure in ${fileName}: expected an array, or an object containing one of [resources, items, data, results]. Found keys: ${Object.keys(parsed).join(', ')}`,
    );
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    // const { AppModule } = require('../src/app.module');

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn', 'log'],
    });

    try {
        const resourcesService = app.get(ResourcesService);

        const absoluteDir = path.resolve(process.cwd(), options.dirPath);
        const entries = await fs.readdir(absoluteDir);

        let files = entries
            .filter((file: string) => file.endsWith('.json'))
            .sort((a: string, b: string) => a.localeCompare(b));

        if (options.limit && Number.isFinite(options.limit)) {
            files = files.slice(0, options.limit);
        }

        console.log(`Fichiers à importer: ${files.length}`);

        for (const file of files) {
            const absolutePath = path.join(absoluteDir, file);
            const raw = await fs.readFile(absolutePath, 'utf-8');
            const parsed = JSON.parse(raw);

            const items = extractResourceItems(parsed, file);
            const language = inferLanguageFromFileName(file);

            console.log(`Import de ${file} (${items.length} ressources)...`);

            const result = await resourcesService.importBatch(
                {
                    language,
                    fileName: file,
                    source: options.source,
                    items,
                },
                options.importedBy,
            );

            console.log(
                `[DONE] ${file} -> created=${result.stats?.created ?? 0}, updated=${result.stats?.updated ?? 0}, rejected=${result.stats?.rejected ?? 0}`,
            );
        }
    } finally {
        await app.close();
    }
}

main().catch((error) => {
    console.error('Bulk import failed:', error);
    process.exit(1);
});