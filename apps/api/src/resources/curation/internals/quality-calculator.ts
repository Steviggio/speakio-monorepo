export interface QualityEvaluationResult {
  score: number;
  descriptionScore: number;
  flags: string[];
  reviewReasons: string[];
  isPublishable: boolean;
  normalizationStatus: string;
  descriptionSource: string;
}

export class QualityCalculator {
  evaluate(input: {
    rawDescription?: string;
    normalizedTitle: string;
    normalizedDescription: string;
    normalizedType?: string;
    normalizedLanguage?: string;
    sourcePlatformExists: boolean;
    publisherExists: boolean;
    seriesExists: boolean;
  }): QualityEvaluationResult {
    const flags: string[] = [];
    const reviewReasons: string[] = [];

    let score = 0;
    let descriptionScore = 0;

    score += 20;
    if (!input.sourcePlatformExists) {
      score -= 10;
      flags.push('MISSING_SOURCE_PLATFORM');
    }

    if (
      !input.normalizedTitle ||
      input.normalizedTitle === 'Untitled resource'
    ) {
      flags.push('MISSING_TITLE');
    } else {
      score += 10;
    }

    if (!input.rawDescription) {
      flags.push('MISSING_DESCRIPTION');
      reviewReasons.push('NEEDS_EDITORIAL_REWRITE');
    }

    if (input.normalizedDescription === 'No description available.') {
      flags.push('DESCRIPTION_FALLBACK');
      descriptionScore += 5;
      score += 5;
    } else if (input.normalizedDescription.length < 30) {
      flags.push('DESCRIPTION_TOO_SHORT');
      reviewReasons.push('LOW_SCORE');
      descriptionScore += 20;
      score += 10;
    } else if (input.normalizedDescription.length < 80) {
      descriptionScore += 45;
      score += 20;
    } else {
      descriptionScore += 80;
      score += 30;
    }

    if (
      ['news.', 'tv.', 'radio.', 'exercises.', 'exercise.'].includes(
        input.normalizedDescription.toLowerCase(),
      )
    ) {
      flags.push('GENERIC_DESCRIPTION');
      reviewReasons.push('NEEDS_EDITORIAL_REWRITE');
      descriptionScore = Math.max(0, descriptionScore - 30);
      score -= 10;
    }

    if (input.normalizedType) score += 10;
    if (input.normalizedLanguage && input.normalizedLanguage !== 'multi') {
      score += 10;
    }
    if (input.publisherExists) score += 5;
    if (input.seriesExists) score += 5;

    score = Math.max(0, Math.min(100, score));
    descriptionScore = Math.max(0, Math.min(100, descriptionScore));

    const isPublishable =
      score >= 80 &&
      !flags.includes('MISSING_TITLE') &&
      !flags.includes('DESCRIPTION_FALLBACK') &&
      !flags.includes('GENERIC_DESCRIPTION');

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
      descriptionSource: input.rawDescription ? 'SCRAPED' : 'MANUAL',
    };
  }
}
