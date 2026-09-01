import { Injectable } from '@nestjs/common';
import { resolveLanguageCode } from '../config/language-registry';

@Injectable()
export class ResourceContentNormalizationService {
    normalize(raw: {
        title: string;
        description: string;
        language: string;
        pricing: string;
        url?: string;
    }, fallbackLanguage: string) {
        return {
            title: this.normalizeTitle(raw.title, raw.description, raw.url),
            description: this.normalizeDescription(raw.description),
            language: this.normalizeLanguage(raw.language || fallbackLanguage),
            pricing: this.normalizePricing(raw.pricing),
        };
    }

    private normalizeTitle(value: string, description: string, url?: string): string {
        let cleaned = value
            .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, '') // Strip soft hyphens and zero-width spaces
            .replace(/\s+/g, ' ')
            .replace(/\s*[-|–—]\s*(YouTube|LanguageList\.org|Accueil)$/i, '')
            .trim();

        // Remove trailing slashes (directory-style titles like "Amharic/")
        cleaned = cleaned.replace(/\/+$/, '');

        const genericTitles = [
            'web site', 'website', 'youtube', 'itunes free', 'free itunes audio',
            'series 1 itunes', 'series 2 itunes', 'spotify', 'podcast', 'accueil',
            'massive open online course (mooc)', 'massive open online course',
            'free online video/mooc', 'mooc/online course'
        ];

        // If title is a bare URL or a very generic useless string, extract a readable name
        if (/^https?:\/\//i.test(cleaned) || genericTitles.includes(cleaned.toLowerCase())) {
            cleaned = this.extractTitleFromUrl(url || cleaned);
        }

        // Context-aware title enrichment for FSI-style entries
        // Titles like "Amharic" with FSI descriptions become "FSI Amharic Course"
        if (
            /^[A-Z][a-zA-Zéèêëàâùûôîïç\s-]+$/.test(cleaned) &&
            cleaned.split(/\s+/).length <= 3 &&
            description.toLowerCase().includes('fsi')
        ) {
            cleaned = `FSI ${cleaned} Course`;
        }

        return cleaned || 'Untitled resource';
    }

    private extractTitleFromUrl(url: string): string {
        try {
            const parsed = new URL(url);
            
            // Try to extract from pathname first
            let pathSegments = parsed.pathname.split('/').filter(Boolean);
            
            // Exclude common useless path segments
            pathSegments = pathSegments.filter(s => !['us', 'podcast', 'id', 'playlist', 'channel', 'user', 'watch', 'v'].includes(s));
            
            let bestSegment = pathSegments.pop();
            // Handle iTunes id segments like 'id123456'
            if (bestSegment && /^id\d+$/.test(bestSegment)) {
                bestSegment = pathSegments.pop() || bestSegment;
            }
            
            // Exclude short alphanumeric hashes commonly used in affiliate links/shortlinks (e.g. DVZG3a)
            const isShortHash = bestSegment && /^[a-zA-Z0-9]{4,8}$/.test(bestSegment) && !/^[a-zA-Z]+$/.test(bestSegment);
            
            if (bestSegment && bestSegment.length > 2 && !isShortHash) {
                // Return Title Case of the best segment
                return bestSegment
                    .replace(/[-_]/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
            }

            // Fallback to domain if pathname yielded nothing
            const domain = parsed.hostname.replace(/^www\./, '');
            const firstSegment = domain.split('.')[0];

            return firstSegment
                .split('-')
                .filter(Boolean)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(' ');
        } catch {
            return 'Untitled resource';
        }
    }

    private normalizeDescription(value: string): string {
        const cleaned = value.replace(/\s+/g, ' ').trim();
        return cleaned || 'No description available.';
    }

    private normalizeLanguage(value: string): string {
        const resolved = resolveLanguageCode(value);
        if (resolved) return resolved;

        // Graceful fallback: if unresolvable, default to 'multi'
        return 'multi';
    }

    private normalizePricing(value: string): 'FREE' | 'FREEMIUM' | 'PREMIUM' {
        const normalized = value.trim().toUpperCase();
        if (normalized === 'FREEMIUM') return 'FREEMIUM';
        if (normalized === 'PREMIUM') return 'PREMIUM';
        return 'FREE';
    }
}