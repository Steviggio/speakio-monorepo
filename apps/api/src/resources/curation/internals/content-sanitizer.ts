import type { Pricing } from '@repo/types';

export interface SanitizedContentResult {
  title: string;
  description: string;
  language: string;
  pricing: Pricing;
}

export class ContentSanitizer {
  sanitize(
    raw: {
      title?: string;
      description?: string;
      language?: string;
      pricing?: string;
    },
    fallbackLanguage?: string,
  ): SanitizedContentResult {
    return {
      title: this.sanitizeTitle(raw.title),
      description: this.sanitizeDescription(raw.description),
      language: this.sanitizeLanguage(raw.language || fallbackLanguage),
      pricing: this.sanitizePricing(raw.pricing),
    };
  }

  sanitizeTitle(value?: string): string {
    if (!value || typeof value !== 'string') {
      return 'Untitled resource';
    }

    const cleaned = value
      .replace(/\s+/g, ' ')
      .replace(/\s*[-|–—]\s*(YouTube|LanguageList\.org|Accueil)$/i, '')
      .trim();

    return cleaned || 'Untitled resource';
  }

  sanitizeDescription(value?: string): string {
    if (!value || typeof value !== 'string') {
      return 'No description available.';
    }

    const cleaned = value.replace(/\s+/g, ' ').trim();
    return cleaned || 'No description available.';
  }

  sanitizeLanguage(value?: string): string {
    if (!value || typeof value !== 'string') {
      return 'multi';
    }

    const normalized = value.trim().toLowerCase();
    if (!normalized) return 'multi';

    const map: Record<string, string> = {
      french: 'fr',
      english: 'en',
      spanish: 'es',
      german: 'de',
      portuguese: 'pt',
      italian: 'it',
      japanese: 'ja',
      korean: 'ko',
      chinese: 'zh',
      russian: 'ru',
      arabic: 'ar',
    };

    return map[normalized] ?? normalized;
  }

  sanitizePricing(value?: string): Pricing {
    if (!value || typeof value !== 'string') {
      return 'FREE';
    }

    const normalized = value.trim().toUpperCase();
    if (normalized === 'FREEMIUM') return 'FREEMIUM';
    if (normalized === 'PREMIUM') return 'PREMIUM';
    return 'FREE';
  }
}
