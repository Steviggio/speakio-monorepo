import { Injectable } from '@nestjs/common';
import type { ResourceType, ResourceFormat, ResourceLevel, ResourcePlatform } from "@repo/types";

@Injectable()
export class ResourceClassificationService {
    classify(input: {
        rawType: string;
        url: string;
        title: string;
        description: string;
    }): {
        type: ResourceType;
        platform: ResourcePlatform;
        formats: ResourceFormat[];
        levels: ResourceLevel[];
    } {
        const platform = this.inferPlatform(input.url);
        const type = this.inferResourceType(input, platform);

        return {
            type,
            platform,
            formats: this.mapFormats(type, platform),
            levels: this.inferLevels(input.title, input.description),
        };
    }

    private inferPlatform(url: string): ResourcePlatform {
        let domain: string;
        try {
            domain = new URL(url).hostname.replace(/^www\./, '');
        } catch {
            return 'OTHER';
        }

        const PLATFORM_MAP: Record<string, ResourcePlatform> = {
            'youtube.com': 'YOUTUBE',
            'm.youtube.com': 'YOUTUBE',
            'youtu.be': 'YOUTUBE',
            'tiktok.com': 'TIKTOK',
            'instagram.com': 'INSTAGRAM',
            'open.spotify.com': 'SPOTIFY',
            'spotify.com': 'SPOTIFY',
            'podcasts.apple.com': 'APPLE_PODCASTS',
            'itunes.apple.com': 'APPLE_PODCASTS',
            'reddit.com': 'REDDIT',
            'old.reddit.com': 'REDDIT',
            'discord.gg': 'DISCORD',
            'discord.com': 'DISCORD',
            't.me': 'TELEGRAM',
            'web.telegram.org': 'TELEGRAM',
            'netflix.com': 'NETFLIX',
            'play.google.com': 'GOOGLE_PLAY',
            'apps.apple.com': 'APP_STORE',
            'github.com': 'GITHUB',
        };

        return PLATFORM_MAP[domain] ?? 'OTHER';
    }

    private inferResourceType(
        input: { rawType: string; url: string; title: string; description: string },
        platform: ResourcePlatform,
    ): ResourceType {
        const { rawType, url, title, description } = input;
        const haystack = `${title} ${description} ${url}`.toLowerCase();
        const rawTypeLower = rawType.toLowerCase();

        // 1. Explicit rawType mappings (scraper already classified)
        if (rawTypeLower.includes('course') || rawTypeLower.includes('cours')) return 'COURSE';
        if (rawTypeLower.includes('app')) return 'APP';
        if (rawTypeLower.includes('book') || rawTypeLower.includes('ebook')) return 'BOOK';
        if (rawTypeLower.includes('video')) return 'VIDEO';
        if (rawTypeLower.includes('article')) return 'ARTICLE';
        if (rawTypeLower.includes('audio') || rawTypeLower.includes('podcast')) return 'AUDIO';
        if (rawTypeLower.includes('chat') || rawTypeLower.includes('exchange')) return 'CHAT';
        if (rawTypeLower.includes('tool') || rawTypeLower.includes('dictionary')) return 'TOOL';

        // 2. Platform-based inference
        if (platform === 'YOUTUBE') return 'VIDEO';
        if (platform === 'TIKTOK') return 'VIDEO';
        if (platform === 'INSTAGRAM') return 'VIDEO';
        if (platform === 'SPOTIFY') return 'AUDIO';
        if (platform === 'APPLE_PODCASTS') return 'AUDIO';
        if (platform === 'NETFLIX') return 'VIDEO';
        if (platform === 'DISCORD' || platform === 'TELEGRAM') return 'CHAT';
        if (platform === 'APP_STORE' || platform === 'GOOGLE_PLAY') return 'APP';

        // 3. Content-based heuristics for COURSE
        if (
            haystack.includes('course') ||
            haystack.includes('cours ') ||
            haystack.includes('lesson') ||
            haystack.includes('leçon') ||
            haystack.includes('method') ||
            haystack.includes('méthode') ||
            haystack.includes('curriculum') ||
            haystack.includes('textbook') ||
            haystack.includes('fsi') ||
            haystack.includes('foreign service institute') ||
            haystack.includes('peace corps') ||
            haystack.includes('dli ') ||
            url.includes('/course') ||
            url.includes('/learn/')
        ) {
            return 'COURSE';
        }

        // 4. Content-based heuristics for TOOL
        if (
            haystack.includes('dictionary') ||
            haystack.includes('dictionnaire') ||
            haystack.includes('conjugat') ||
            haystack.includes('translator') ||
            haystack.includes('traducteur') ||
            haystack.includes('flashcard') ||
            haystack.includes('anki') ||
            haystack.includes('declension') ||
            haystack.includes('grammar checker') ||
            haystack.includes('spaced repetition')
        ) {
            return 'TOOL';
        }

        // 5. Video patterns
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

        // 6. Audio patterns
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

        // 7. Book patterns
        if (
            haystack.includes('ebook') ||
            haystack.includes('ebooks') ||
            haystack.includes('gutenberg') ||
            haystack.includes('free books')
        ) {
            return 'BOOK';
        }

        // 8. App patterns (broader detection)
        if (
            haystack.includes('play.google.com') ||
            haystack.includes('apps.apple.com') ||
            haystack.includes('mobile app')
        ) {
            return 'APP';
        }

        return 'WEBSITE';
    }

    private mapFormats(type: ResourceType, platform: ResourcePlatform): ResourceFormat[] {
        if (type === 'VIDEO') return ['VIDEO'];
        if (type === 'AUDIO') return ['AUDIO'];
        if (type === 'APP') return ['MOBILE', 'INTERACTIVE'];
        if (type === 'COURSE') return ['TEXT', 'AUDIO'];
        if (type === 'TOOL') return ['INTERACTIVE'];
        if (type === 'CHAT') return ['INTERACTIVE'];
        return ['TEXT'];
    }

    private inferLevels(title: string, description: string): ResourceLevel[] {
        const haystack = `${title} ${description}`.toLowerCase();
        const levels: ResourceLevel[] = [];

        if (
            haystack.includes('beginner') ||
            haystack.includes('debutant') ||
            haystack.includes('débutant') ||
            haystack.includes('a1') ||
            haystack.includes('a2') ||
            haystack.includes('introduct') ||
            haystack.includes('basic')
        ) {
            levels.push('BEGINNER');
        }

        if (
            haystack.includes('intermediate') ||
            haystack.includes('intermédiaire') ||
            haystack.includes('b1') ||
            haystack.includes('b2')
        ) {
            levels.push('INTERMEDIATE');
        }

        if (
            haystack.includes('advanced') ||
            haystack.includes('avancé') ||
            haystack.includes('avance') ||
            haystack.includes('c1') ||
            haystack.includes('c2')
        ) {
            levels.push('ADVANCED');
        }

        return levels;
    }
}