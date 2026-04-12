import { Injectable } from '@nestjs/common';

@Injectable()
export class ResourceContentNormalizationService {
  normalize(
    raw: {
      title: string;
      description: string;
      language: string;
      pricing: string;
    },
    fallbackLanguage: string,
  ) {
    return {
      title: this.normalizeTitle(raw.title),
      description: this.normalizeDescription(raw.description),
      language: this.normalizeLanguage(raw.language || fallbackLanguage),
      pricing: this.normalizePricing(raw.pricing),
    };
  }

  private normalizeTitle(value: string): string {
    const cleaned = value
      .replace(/\s+/g, ' ')
      .replace(/\s*[-|–—]\s*(YouTube|LanguageList\.org|Accueil)$/i, '')
      .trim();

    return cleaned || 'Untitled resource';
  }

  private normalizeDescription(value: string): string {
    const cleaned = value.replace(/\s+/g, ' ').trim();
    return cleaned || 'No description available.';
  }

  private normalizeLanguage(value: string): string {
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

  private normalizePricing(value: string): 'FREE' | 'FREEMIUM' | 'PREMIUM' {
    const normalized = value.trim().toUpperCase();
    if (normalized === 'FREEMIUM') return 'FREEMIUM';
    if (normalized === 'PREMIUM') return 'PREMIUM';
    return 'FREE';
  }
}
