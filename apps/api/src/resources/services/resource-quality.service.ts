import { Injectable } from '@nestjs/common';

@Injectable()
export class ResourceQualityService {
    compute(input: {
        raw: { description: string };
        normalized: {
            title: string;
            description: string;
            type: string;
            language: string;
        };
        sourcePlatformExists: boolean;
        inferredPublisherExists: boolean;
        inferredSeriesExists: boolean;
        batchDescriptionCounts?: Record<string, number>;
    }) {
        const flags: string[] = [];
        const reviewReasons: string[] = [];

        let score = 0;
        let descriptionScore = 0;

        score += 20;
        if (!input.sourcePlatformExists) {
            score -= 10;
            flags.push('MISSING_SOURCE_PLATFORM');
        }

        if (!input.normalized.title || input.normalized.title === 'Untitled resource') {
            flags.push('MISSING_TITLE');
        } else {
            score += 10;
        }

        // Flag slug-style titles (single capitalized word, or trailing slash patterns)
        if (
            /^[A-Z][a-z]+\/?$/.test(input.normalized.title) ||
            /^https?:\/\//.test(input.normalized.title)
        ) {
            flags.push('SLUG_TITLE');
            score -= 15;
            reviewReasons.push('LOW_SCORE');
        }

        if (!input.raw.description) {
            flags.push('MISSING_DESCRIPTION');
            reviewReasons.push('NEEDS_EDITORIAL_REWRITE');
        }

        if (input.normalized.description === 'No description available.') {
            flags.push('DESCRIPTION_FALLBACK');
            descriptionScore += 5;
            score += 5;
        } else if (input.normalized.description.length < 30) {
            flags.push('DESCRIPTION_TOO_SHORT');
            reviewReasons.push('LOW_SCORE');
            descriptionScore += 20;
            score += 10;
        } else if (input.normalized.description.length < 80) {
            descriptionScore += 45;
            score += 20;
        } else {
            descriptionScore += 80;
            score += 30;
        }

        if (
            ['news.', 'tv.', 'radio.', 'exercises.', 'exercise.'].includes(
                input.normalized.description.toLowerCase(),
            )
        ) {
            flags.push('GENERIC_DESCRIPTION');
            reviewReasons.push('NEEDS_EDITORIAL_REWRITE');
            descriptionScore = Math.max(0, descriptionScore - 30);
            score -= 10;
        }

        // Batch duplicate description detection
        if (
            input.batchDescriptionCounts &&
            input.raw.description &&
            input.batchDescriptionCounts[input.raw.description] > 3
        ) {
            flags.push('BATCH_DUPLICATE_DESCRIPTION');
            reviewReasons.push('NEEDS_EDITORIAL_REWRITE');
            descriptionScore = Math.max(0, descriptionScore - 40);
            score -= 15;
        }

        if (input.normalized.type) score += 10;
        if (input.normalized.language && input.normalized.language !== 'multi') score += 10;
        if (input.inferredPublisherExists) score += 5;
        if (input.inferredSeriesExists) score += 5;

        score = Math.max(0, Math.min(100, score));
        descriptionScore = Math.max(0, Math.min(100, descriptionScore));

        const isPublishable =
            score >= 80 &&
            !flags.includes('MISSING_TITLE') &&
            !flags.includes('SLUG_TITLE') &&
            !flags.includes('DESCRIPTION_FALLBACK') &&
            !flags.includes('GENERIC_DESCRIPTION') &&
            !flags.includes('BATCH_DUPLICATE_DESCRIPTION');

        if (!isPublishable && reviewReasons.length === 0) {
            reviewReasons.push('LOW_SCORE');
        }

        return {
            score,
            descriptionScore,
            flags,
            reviewReasons,
            isPublishable,
            normalizationStatus: isPublishable ? 'PUBLISHED' : 'NORMALIZED',
            descriptionSource: input.raw.description ? 'SCRAPED' : 'MANUAL',
        };
    }
}