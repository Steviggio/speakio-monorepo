import { Injectable } from '@nestjs/common';
import type { ResourceStatus } from '@repo/types';
import { UrlCanonicalizer } from './internals/url-canonicalizer';
import { ContentSanitizer } from './internals/content-sanitizer';
import { ClassifierEngine } from './internals/classifier-engine';
import { InferenceHeuristics } from './internals/inference-heuristics';
import { QualityCalculator } from './internals/quality-calculator';
import type {
  ResourceCandidateInput,
  CuratedResourceOutput,
} from './resource-curation.types';

@Injectable()
export class ResourceCurationPipeline {
  private readonly urlCanonicalizer = new UrlCanonicalizer();
  private readonly contentSanitizer = new ContentSanitizer();
  private readonly classifierEngine = new ClassifierEngine();
  private readonly inferenceHeuristics = new InferenceHeuristics();
  private readonly qualityCalculator = new QualityCalculator();

  curate(input: ResourceCandidateInput): CuratedResourceOutput {
    // 1. Validate & canonicalize URL (throws if syntactically invalid or empty)
    const normalizedUrl = this.urlCanonicalizer.canonicalize(input.url);

    // 2. Sanitize title, description, language, pricing
    const sanitized = this.contentSanitizer.sanitize(
      {
        title: input.title,
        description: input.description,
        language: input.language,
        pricing: input.pricing,
      },
      input.language,
    );

    // 3. Classify type, formats, levels
    const classification = this.classifierEngine.classify({
      rawType: input.type,
      url: input.url,
      title: sanitized.title,
      description: sanitized.description,
      formats: input.formats,
      levels: input.levels,
    });

    // 4. Infer publisher & series (if not supplied)
    const publisher =
      input.publisher?.slug && input.publisher?.name
        ? { slug: input.publisher.slug, name: input.publisher.name }
        : this.inferenceHeuristics.inferPublisher(
            sanitized.title,
            sanitized.description,
            input.url,
          );

    const series =
      input.series?.slug && input.series?.name
        ? { slug: input.series.slug, name: input.series.name }
        : this.inferenceHeuristics.inferSeries(
            sanitized.title,
            sanitized.description,
          );

    // 5. Compute quality score, flags, publishability
    const quality = this.qualityCalculator.evaluate({
      rawDescription: input.description,
      normalizedTitle: sanitized.title,
      normalizedDescription: sanitized.description,
      normalizedType: classification.type,
      normalizedLanguage: sanitized.language,
      sourcePlatformExists: Boolean(normalizedUrl.sourcePlatform),
      publisherExists: Boolean(publisher),
      seriesExists: Boolean(series),
    });

    // 6. Resolve status: input.existing?.status ?? input.status ?? (quality.isPublishable ? 'PUBLISHED' : 'REVIEW')
    const status: ResourceStatus =
      input.existing?.status ??
      input.status ??
      (quality.isPublishable ? 'PUBLISHED' : 'REVIEW');

    const isActive = input.existing?.isActive ?? input.isActive ?? true;

    // 7. Assemble CuratedResourceOutput
    return {
      title: sanitized.title,
      description: sanitized.description,
      url: input.url,
      canonicalUrl: normalizedUrl.canonicalUrl,
      type: classification.type,
      language: sanitized.language,
      pricing: sanitized.pricing,
      tags: Array.isArray(input.tags) ? input.tags.map((t) => String(t)) : [],
      levels: classification.levels,
      formats: classification.formats,
      sourcePlatform: normalizedUrl.sourcePlatform,
      publisher,
      series,
      status,
      isActive,
      sourceMetadata: {
        origin: input.metadata.origin,
        importBatchId: input.metadata.importBatchId,
        rawFileName: input.metadata.rawFileName,
        rawTitle: input.title || null,
      },
      thumbnailUrl: null,
      authorOrPublisher: publisher?.name ?? null,
      quality: {
        score: quality.score,
        descriptionScore: quality.descriptionScore,
        normalizationStatus: quality.normalizationStatus,
        descriptionSource: quality.descriptionSource,
        flags: quality.flags,
        reviewReasons: quality.reviewReasons,
        duplicateOf: null,
        isPublishable: quality.isPublishable,
        lastNormalizedAt: new Date(),
      },
      raw: {
        sourceName: input.metadata.source ?? 'manual',
        sourcePageUrl: null,
        scrapedAt: new Date(),
        scraperVersion: null,
        title: input.title || null,
        description: input.description || null,
        url: input.url || null,
        language: input.language || null,
        type: input.type || null,
        pricing: input.pricing || null,
        tags: input.tags ?? [],
      },
      enrichment: {
        resolvedUrl: null,
        finalUrl: null,
        fetchedAt: null,
        httpStatus: null,
        htmlTitle: null,
        metaDescription: null,
        ogTitle: null,
        ogDescription: null,
        twitterTitle: null,
        twitterDescription: null,
        jsonLdTitle: null,
        jsonLdDescription: null,
        extractedFirstParagraph: null,
        extractedAuthor: null,
        extractedPublisher: null,
        pageLanguage: null,
      },
    };
  }
}
