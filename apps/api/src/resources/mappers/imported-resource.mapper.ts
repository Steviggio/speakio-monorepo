import type { ResourceFormat, ResourceType, Pricing } from "@repo/types";

type ImportedResourceMapperInput = {
  item: Record<string, unknown>;
  language: string;
  fileName: string;
  importBatchId: string;
  normalizedUrl: {
    canonicalUrl: string;
    sourcePlatform: {
      domain: string;
      rootDomain: string;
      baseUrl: string;
      label: string;
    };
  };
  inferredPublisher: {
    slug: string;
    name: string;
  } | null;
  inferredSeries: {
    slug: string;
    name: string;
  } | null;
};

export function mapImportedResourceItem({
  item,
  language,
  fileName,
  importBatchId,
  normalizedUrl,
  inferredPublisher,
  inferredSeries,
}: ImportedResourceMapperInput) {
  const rawTitle = String(item.title ?? '');
  const rawDescription = String(item.description ?? '');
  const url = String(item.url ?? '').trim();
  const rawType = String(item.type ?? '').toLowerCase();
  const rawPricing = String(item.pricing ?? 'FREE').toUpperCase();

  if (!url) {
    throw new Error('Mapped item has empty url');
  }

  const title = nonEmptyOrFallback(rawTitle, 'Untitled resource');
  const description = nonEmptyOrFallback(
    rawDescription,
    'No description available.',
  );

  const type = inferResourceType({
    rawType,
    url,
    title,
    description,
  });

  const formats = mapFormats(type);
  const pricing = normalizePricing(rawPricing);

  return {
    title,
    description,
    url,
    canonicalUrl: normalizedUrl.canonicalUrl,
    type,
    language,
    tags: Array.isArray(item.tags) ? item.tags.map((tag) => String(tag)) : [],
    pricing,
    sourcePlatform: normalizedUrl.sourcePlatform,
    publisher: inferredPublisher,
    series: inferredSeries,
    formats,
    levels: [],
    status: 'REVIEW' as const,
    isActive: true,
    sourceMetadata: {
      origin: 'SCRAPING' as const,
      importBatchId,
      rawFileName: fileName,
      rawTitle: rawTitle || null,
    },
    thumbnailUrl: null,
    authorOrPublisher: inferredPublisher?.name ?? null,
  };
}

function normalizePricing(value: string): Pricing {
  if (value === 'FREEMIUM') return 'FREEMIUM';
  if (value === 'PREMIUM') return 'PREMIUM';
  return 'FREE';
}

function nonEmptyOrFallback(value: string, fallback: string): string {
  const normalized = normalizeText(value);
  return normalized.length > 0 ? normalized : fallback;
}

function inferResourceType(input: {
  rawType: string;
  url: string;
  title: string;
  description: string;
}): ResourceType {
  const { rawType, url, title, description } = input;
  const haystack = `${title} ${description} ${url}`.toLowerCase();

  if (rawType.includes('app')) return 'APP';
  if (rawType.includes('book')) return 'BOOK';
  if (rawType.includes('video') || rawType.includes('youtube')) return 'VIDEO';
  if (rawType.includes('article')) return 'ARTICLE';
  if (rawType.includes('audio') || rawType.includes('podcast')) return 'AUDIO';
  if (rawType.includes('chat')) return 'CHAT';

  if (
    haystack.includes('youtube.com') ||
    haystack.includes('youtu.be') ||
    haystack.includes('/playlist') ||
    haystack.includes('/channel/') ||
    haystack.includes('/user/') ||
    haystack.includes('/@')
  ) {
    return 'VIDEO';
  }

  if (
    haystack.includes('podcast') ||
    haystack.includes('radio') ||
    haystack.includes('audiobook') ||
    haystack.includes('audiobooks') ||
    haystack.includes('spotify.com') ||
    haystack.includes('podbean.com') ||
    haystack.includes('audio')
  ) {
    return 'AUDIO';
  }

  if (
    haystack.includes('ebook') ||
    haystack.includes('ebooks') ||
    haystack.includes('books') ||
    haystack.includes('gutenberg')
  ) {
    return 'BOOK';
  }

  if (
    haystack.includes('dictionary') ||
    haystack.includes('dictionnaire') ||
    haystack.includes('forum') ||
    haystack.includes('news') ||
    haystack.includes('tv') ||
    haystack.includes('grammar') ||
    haystack.includes('exercise') ||
    haystack.includes('exercises')
  ) {
    return 'WEBSITE';
  }

  return 'WEBSITE';
}

function mapFormats(type: ResourceType): ResourceFormat[] {
  switch (type) {
    case 'VIDEO':
      return ['VIDEO'];
    case 'AUDIO':
      return ['AUDIO'];
    case 'APP':
      return ['MOBILE', 'INTERACTIVE'];
    case 'WEBSITE':
    case 'ARTICLE':
    case 'BOOK':
      return ['TEXT'];
    default:
      return [];
  }
}

function normalizeText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}