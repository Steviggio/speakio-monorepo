const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
    path: path.resolve(process.cwd(), '../../.env'),
});

import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Resource, ResourceDocument } from '../src/schemas/resource.schema';
import { AppModule } from 'src/app.module';

type CliOptions = {
    language?: string;
    onlyReview: boolean;
    limit?: number;
};

function parseArgs(argv: string[]): CliOptions {
    const getValue = (flag: string): string | undefined => {
        const index = argv.findIndex((arg) => arg === flag);
        if (index === -1) return undefined;
        return argv[index + 1];
    };

    const limitValue = getValue('--limit');

    return {
        language: getValue('--language'),
        onlyReview: !argv.includes('--all-statuses'),
        limit: limitValue ? Number(limitValue) : undefined,
    };
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

        const filter: Record<string, any> = {};

        if (options.language) {
            filter.language = options.language;
        }

        if (options.onlyReview) {
            filter.status = 'REVIEW';
        }

        const query = resourceModel.find(filter).sort({ createdAt: 1 });

        if (options.limit && Number.isFinite(options.limit)) {
            query.limit(options.limit);
        }

        const docs = await query.exec();

        if (docs.length === 0) {
            console.log('Aucune ressource à publier.');
            return;
        }

        const ids = docs.map((doc) => doc._id);

        const result = await resourceModel.updateMany(
            { _id: { $in: ids } },
            {
                $set: {
                    status: 'PUBLISHED',
                    isActive: true,
                },
            },
        );

        console.log('Publication terminée :');
        console.log(JSON.stringify(result, null, 2));
    } finally {
        await app.close();
    }
}

main().catch((error) => {
    console.error('Publish failed:', error);
    process.exit(1);
});