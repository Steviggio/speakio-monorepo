const path = require('path');
const fs = require('fs/promises');
const dotenv = require('dotenv');

dotenv.config({
    path: path.resolve(process.cwd(), '../../.env'),
});

import { NestFactory } from '@nestjs/core';
import { ResourcesService } from '../src/resources/resources.service';
import { AppModule } from 'src/app.module';

type CliOptions = {
    filePath: string;
    language?: string;
    source: string;
    importedBy: string;
};

function parseArgs(argv: string[]): CliOptions {
    const getValue = (flag: string): string | undefined => {
        const index = argv.findIndex((arg) => arg === flag);
        if (index === -1) return undefined;
        return argv[index + 1];
    };

    const filePath = getValue('--file');
    if (!filePath) {
        throw new Error(
            'Usage: npx ts-node scripts/import-language-file.ts --file <path> [--language <code>] [--source playwright] [--importedBy system]',
        );
    }

    return {
        filePath,
        language: getValue('--language'),
        source: getValue('--source') ?? 'playwright',
        importedBy: getValue('--importedBy') ?? 'system',
    };
}

function inferLanguageFromFileName(filePath: string): string {
    const base = path.basename(filePath, path.extname(filePath));
    return base.toLowerCase();
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
    filePath: string,
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
            `Unsupported JSON structure in ${filePath}: expected array or object.`,
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
        `Unsupported JSON structure in ${filePath}: expected an array, or an object containing one of [resources, items, data, results]. Found keys: ${Object.keys(parsed).join(', ')}`,
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

        const absolutePath = path.resolve(process.cwd(), options.filePath);
        const raw = await fs.readFile(absolutePath, 'utf-8');
        const parsed = JSON.parse(raw);

        const items = extractResourceItems(parsed, absolutePath);

        const language =
            options.language ?? inferLanguageFromFileName(absolutePath);

        console.log(`Fichier: ${path.basename(absolutePath)}`);
        console.log(`Langue: ${language}`);
        console.log(`Ressources détectées: ${items.length}`);
        console.log('MONGODB_URI =', process.env.MONGODB_URI);

        const result = await resourcesService.importBatch(
            {
                language,
                fileName: path.basename(absolutePath),
                source: options.source,
                items,
            },
            options.importedBy,
        );

        console.log('Import terminé :');
        console.log(JSON.stringify(result, null, 2));
    } finally {
        await app.close();
    }
}

main().catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
});