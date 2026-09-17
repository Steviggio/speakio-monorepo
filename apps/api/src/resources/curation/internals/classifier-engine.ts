import type { ResourceType, ResourceFormat, ResourceLevel } from '@repo/types';

export interface ClassificationResult {
  type: ResourceType;
  formats: ResourceFormat[];
  levels: ResourceLevel[];
}

export class ClassifierEngine {
  classify(input: {
    rawType?: string;
    url: string;
    title: string;
    description: string;
    formats?: ResourceFormat[];
    levels?: ResourceLevel[];
  }): ClassificationResult {
    const type = this.inferResourceType(input);

    const formats =
      input.formats && input.formats.length > 0
        ? input.formats
        : this.mapFormats(type);

    const levels =
      input.levels && input.levels.length > 0
        ? input.levels
        : this.inferLevels(input.title, input.description);

    return {
      type,
      formats,
      levels,
    };
  }

  inferResourceType(input: {
    rawType?: string;
    url: string;
    title: string;
    description: string;
  }): ResourceType {
    const rawType = (input.rawType || '').toLowerCase();
    const { url, title, description } = input;
    const haystack = `${title} ${description} ${url}`.toLowerCase();

    if (rawType.includes('app')) return 'APP';
    if (rawType.includes('book')) return 'BOOK';
    if (rawType.includes('video') || rawType.includes('youtube'))
      return 'VIDEO';
    if (rawType.includes('article')) return 'ARTICLE';
    if (rawType.includes('audio') || rawType.includes('podcast'))
      return 'AUDIO';
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
      haystack.includes('spotify.com') ||
      haystack.includes('podbean.com') ||
      haystack.includes('audiobook') ||
      haystack.includes('audiobooks') ||
      haystack.includes('audio')
    ) {
      return 'AUDIO';
    }

    if (
      haystack.includes('ebook') ||
      haystack.includes('ebooks') ||
      haystack.includes('gutenberg') ||
      haystack.includes('free books')
    ) {
      return 'BOOK';
    }

    return 'WEBSITE';
  }

  mapFormats(type: ResourceType): ResourceFormat[] {
    if (type === 'VIDEO') return ['VIDEO'];
    if (type === 'AUDIO') return ['AUDIO'];
    if (type === 'APP') return ['MOBILE', 'INTERACTIVE'];
    return ['TEXT'];
  }

  inferLevels(title: string, description: string): ResourceLevel[] {
    const haystack = `${title} ${description}`.toLowerCase();
    const levels: ResourceLevel[] = [];

    if (
      haystack.includes('beginner') ||
      haystack.includes('debutant') ||
      haystack.includes('débutant') ||
      haystack.includes('a1') ||
      haystack.includes('a2')
    ) {
      levels.push('BEGINNER');
    }

    if (
      haystack.includes('intermediate') ||
      haystack.includes('b1') ||
      haystack.includes('b2')
    ) {
      levels.push('INTERMEDIATE');
    }

    if (
      haystack.includes('advanced') ||
      haystack.includes('c1') ||
      haystack.includes('c2')
    ) {
      levels.push('ADVANCED');
    }

    return levels;
  }
}
