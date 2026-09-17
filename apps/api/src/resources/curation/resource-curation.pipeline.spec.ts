import { ResourceCurationPipeline } from './resource-curation.pipeline';
import type { ResourceCandidateInput } from './resource-curation.types';

describe('ResourceCurationPipeline', () => {
  let pipeline: ResourceCurationPipeline;

  beforeEach(() => {
    pipeline = new ResourceCurationPipeline();
  });

  describe('URL validation & canonicalization', () => {
    it('throws error when URL is empty or unparseable', () => {
      expect(() =>
        pipeline.curate({
          url: '',
          metadata: { origin: 'MANUAL' },
        }),
      ).toThrow('Invalid URL: URL cannot be empty');

      expect(() =>
        pipeline.curate({
          url: 'not-a-valid-url',
          metadata: { origin: 'MANUAL' },
        }),
      ).toThrow(/Invalid URL.*could not be parsed/);
    });

    it('strips tracking params, removes www, and enforces https', () => {
      const input: ResourceCandidateInput = {
        url: 'http://www.youtube.com/watch?v=12345&utm_source=twitter&utm_medium=social&fbclid=xyz&b=2&a=1',
        title: 'Learn French Basics',
        description:
          'Comprehensive course on French fundamentals for beginners and newcomers.',
        metadata: { origin: 'MANUAL' },
      };

      const result = pipeline.curate(input);

      expect(result.canonicalUrl).toBe(
        'https://youtube.com/watch?a=1&b=2&v=12345',
      );
      expect(result.sourcePlatform.domain).toBe('youtube.com');
      expect(result.sourcePlatform.rootDomain).toBe('youtube.com');
      expect(result.sourcePlatform.label).toBe('YouTube');
    });

    it('removes trailing slash on non-root paths', () => {
      const input: ResourceCandidateInput = {
        url: 'https://example.com/learn/french/',
        metadata: { origin: 'MANUAL' },
      };

      const result = pipeline.curate(input);
      expect(result.canonicalUrl).toBe('https://example.com/learn/french');
    });
  });

  describe('Content sanitization', () => {
    it('strips platform suffixes and falls back when title is missing', () => {
      const result = pipeline.curate({
        url: 'https://example.com/course',
        title: 'French Essentials - YouTube',
        metadata: { origin: 'MANUAL' },
      });

      expect(result.title).toBe('French Essentials');

      const fallbackResult = pipeline.curate({
        url: 'https://example.com/course',
        metadata: { origin: 'MANUAL' },
      });

      expect(fallbackResult.title).toBe('Untitled resource');
    });

    it('normalizes languages and maps full names to ISO codes', () => {
      const result = pipeline.curate({
        url: 'https://example.com/course',
        language: 'French',
        metadata: { origin: 'MANUAL' },
      });

      expect(result.language).toBe('fr');

      const multiResult = pipeline.curate({
        url: 'https://example.com/course',
        metadata: { origin: 'MANUAL' },
      });

      expect(multiResult.language).toBe('multi');
    });

    it('normalizes pricing correctly', () => {
      expect(
        pipeline.curate({
          url: 'https://example.com/course',
          pricing: 'freemium',
          metadata: { origin: 'MANUAL' },
        }).pricing,
      ).toBe('FREEMIUM');

      expect(
        pipeline.curate({
          url: 'https://example.com/course',
          pricing: 'premium',
          metadata: { origin: 'MANUAL' },
        }).pricing,
      ).toBe('PREMIUM');

      expect(
        pipeline.curate({
          url: 'https://example.com/course',
          pricing: 'unknown',
          metadata: { origin: 'MANUAL' },
        }).pricing,
      ).toBe('FREE');
    });
  });

  describe('Classification & Formats', () => {
    it('infers VIDEO type and VIDEO format for youtube links', () => {
      const result = pipeline.curate({
        url: 'https://www.youtube.com/watch?v=abc',
        title: 'French lesson',
        metadata: { origin: 'MANUAL' },
      });

      expect(result.type).toBe('VIDEO');
      expect(result.formats).toEqual(['VIDEO']);
    });

    it('infers AUDIO type and AUDIO format for podcast links', () => {
      const result = pipeline.curate({
        url: 'https://spotify.com/episode/abc',
        title: 'Daily French Podcast',
        metadata: { origin: 'MANUAL' },
      });

      expect(result.type).toBe('AUDIO');
      expect(result.formats).toEqual(['AUDIO']);
    });

    it('preserves caller-supplied formats and levels when provided', () => {
      const result = pipeline.curate({
        url: 'https://example.com/resource',
        formats: ['INTERACTIVE', 'MOBILE'],
        levels: ['ADVANCED'],
        metadata: { origin: 'MANUAL' },
      });

      expect(result.formats).toEqual(['INTERACTIVE', 'MOBILE']);
      expect(result.levels).toEqual(['ADVANCED']);
    });

    it('detects CEFR levels from text heuristics', () => {
      const result = pipeline.curate({
        url: 'https://example.com/resource',
        title: 'French Course Debutant A1 and B2 Intermediate',
        description: 'From beginner to intermediate learners',
        metadata: { origin: 'MANUAL' },
      });

      expect(result.levels).toContain('BEGINNER');
      expect(result.levels).toContain('INTERMEDIATE');
    });
  });

  describe('Publisher & Series inference', () => {
    it('infers publisher from domain rules', () => {
      const result = pipeline.curate({
        url: 'https://didierfle-edito.com/accueil',
        title: 'Edito B1',
        metadata: { origin: 'MANUAL' },
      });

      expect(result.publisher).toEqual({
        slug: 'didier-fle',
        name: 'Didier-FLE',
      });
      expect(result.authorOrPublisher).toBe('Didier-FLE');
    });

    it('infers publisher and series from text heuristics', () => {
      const result = pipeline.curate({
        url: 'https://example.com/lesson',
        title: 'Coffee Break French Lesson 1',
        description: 'Produced by Radio Lingua for learning French',
        metadata: { origin: 'MANUAL' },
      });

      expect(result.publisher).toEqual({
        slug: 'radio-lingua-network',
        name: 'Radio Lingua Network',
      });
      expect(result.series).toEqual({
        slug: 'coffee-break',
        name: 'Coffee Break',
      });
    });

    it('respects caller-supplied publisher and series', () => {
      const result = pipeline.curate({
        url: 'https://example.com/lesson',
        publisher: { slug: 'custom-pub', name: 'Custom Publisher' },
        series: { slug: 'custom-ser', name: 'Custom Series' },
        metadata: { origin: 'MANUAL' },
      });

      expect(result.publisher).toEqual({
        slug: 'custom-pub',
        name: 'Custom Publisher',
      });
      expect(result.series).toEqual({
        slug: 'custom-ser',
        name: 'Custom Series',
      });
    });
  });

  describe('Quality scoring and publishing gating', () => {
    it('scores high quality candidates as publishable (score >= 80)', () => {
      const result = pipeline.curate({
        url: 'https://didierfle-edito.com/resource/french',
        title: 'Comprehensive French Course for Beginners A1',
        description:
          'A very thorough and detailed overview of French grammar, vocabulary, pronunciation, and dialogue practice for beginners.',
        language: 'fr',
        metadata: { origin: 'MANUAL' },
      });

      expect(result.quality.score).toBeGreaterThanOrEqual(80);
      expect(result.quality.isPublishable).toBe(true);
      expect(result.status).toBe('PUBLISHED');
      expect(result.quality.flags).toHaveLength(0);
    });

    it('sets status to REVIEW when publishability score threshold is not met', () => {
      const result = pipeline.curate({
        url: 'https://example.com/short',
        title: 'Short',
        description: 'Short',
        metadata: { origin: 'MANUAL' },
      });

      expect(result.quality.score).toBeLessThan(80);
      expect(result.quality.isPublishable).toBe(false);
      expect(result.status).toBe('REVIEW');
      expect(result.quality.flags).toContain('DESCRIPTION_TOO_SHORT');
    });

    it('respects caller-provided status override', () => {
      const result = pipeline.curate({
        url: 'https://example.com/short',
        title: 'Short',
        description: 'Short',
        status: 'PUBLISHED',
        metadata: { origin: 'MANUAL' },
      });

      expect(result.status).toBe('PUBLISHED');
    });

    it('respects existing status and existing isActive when provided', () => {
      const result = pipeline.curate({
        url: 'https://didierfle-edito.com/resource/french',
        title: 'Comprehensive French Course for Beginners A1',
        description:
          'A very thorough and detailed overview of French grammar, vocabulary, pronunciation, and dialogue practice for beginners.',
        language: 'fr',
        metadata: { origin: 'IMPORT' },
        existing: {
          status: 'ARCHIVED',
          isActive: false,
        },
      });

      expect(result.status).toBe('ARCHIVED');
      expect(result.isActive).toBe(false);
    });
  });
});
