import type { ResourceFormat, ResourceType, ResourcePlatform, Pricing, ResourceLevel } from "@repo/types";

export function mapImportedResourceToDocument(input: {
  dto: { source?: string; fileName: string };
  raw: {
    title: string;
    description: string;
    url: string;
    language: string;
    type: string;
    pricing: string;
    tags: string[];
  };
  normalized: {
    title: string;
    description: string;
    language: string;
    pricing: Pricing;
  };
  normalizedUrl: {
    canonicalUrl: string;
    sourcePlatform: {
      domain: string;
      rootDomain: string;
      baseUrl: string;
      label: string;
    };
  };
  classification: {
    type: ResourceType;
    platform: ResourcePlatform;
    formats: ResourceFormat[];
    levels: ResourceLevel[];
  };
  inferredPublisher: { slug: string; name: string } | null;
  inferredSeries: { slug: string; name: string } | null;
  quality: {
    score: number;
    descriptionScore: number;
    flags: string[];
    reviewReasons: string[];
    isPublishable: boolean;
    normalizationStatus: string;
    descriptionSource: string;
  };
  importBatchId: string;
  existingStatus?: string;
  existingIsActive?: boolean;
}) {
  const {
    dto,
    raw,
    normalized,
    normalizedUrl,
    classification,
    inferredPublisher,
    inferredSeries,
    quality,
    importBatchId,
    existingStatus,
    existingIsActive,
  } = input;

  return {
    title: normalized.title,
    description: normalized.description,
    url: raw.url,
    canonicalUrl: normalizedUrl.canonicalUrl,
    type: classification.type,
    platform: classification.platform,
    language: normalized.language,
    tags: raw.tags,
    pricing: normalized.pricing,
    sourcePlatform: normalizedUrl.sourcePlatform,
    publisher: inferredPublisher,
    series: inferredSeries,
    levels: classification.levels,
    formats: classification.formats,
    status: existingStatus ?? (quality.isPublishable ? 'PUBLISHED' : 'REVIEW'),
    isActive: existingIsActive ?? true,
    sourceMetadata: {
      origin: 'SCRAPING',
      importBatchId,
      rawFileName: dto.fileName,
      rawTitle: raw.title || null,
    },
    thumbnailUrl: null,
    authorOrPublisher: inferredPublisher?.name ?? null,

    raw: {
      sourceName: dto.source ?? 'playwright',
      sourcePageUrl: null,
      scrapedAt: new Date(),
      scraperVersion: null,
      title: raw.title || null,
      description: raw.description || null,
      url: raw.url || null,
      language: raw.language || null,
      type: raw.type || null,
      pricing: raw.pricing || null,
      tags: raw.tags,
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
  };
}