// src/config/constants.ts

/**
 * ISO 639-1 language detection mapping.
 * Keys are lowercase language name variants (English + French labels),
 * values are ISO 639-1 codes. Multi-lingual aliases ensure we catch
 * both English source pages (Reddit, OpenCulture) and French ones (BPI).
 */
export const LANGUAGE_MAP: Readonly<Record<string, string>> = {
  'amharic': 'am', 'arabic': 'ar', 'arabe': 'ar', 'bengali': 'bn',
  'bulgarian': 'bg', 'cambodian': 'km', 'khmer': 'km', 'cantonese': 'zh',
  'catalan': 'ca', 'chinese': 'zh', 'chinois': 'zh', 'mandarin': 'zh',
  'czech': 'cs', 'danish': 'da', 'danois': 'da', 'dutch': 'nl',
  'néerlandais': 'nl', 'english': 'en', 'anglais': 'en', 'finnish': 'fi',
  'french': 'fr', 'français': 'fr', 'fle': 'fr', 'german': 'de',
  'allemand': 'de', 'greek': 'el', 'grec': 'el', 'hausa': 'ha',
  'hebrew': 'he', 'hindi': 'hi', 'hungarian': 'hu', 'hongrois': 'hu',
  'icelandic': 'is', 'islandais': 'is', 'igbo': 'ig', 'indonesian': 'id',
  'italian': 'it', 'italien': 'it', 'japanese': 'ja', 'japonais': 'ja',
  'korean': 'ko', 'coréen': 'ko', 'lao': 'lo', 'latin': 'la',
  'lingala': 'ln', 'malay': 'ms', 'nepali': 'ne', 'norwegian': 'no',
  'norvégien': 'no', 'persian': 'fa', 'polish': 'pl', 'polonais': 'pl',
  'portuguese': 'pt', 'portugais': 'pt', 'romanian': 'ro', 'russian': 'ru',
  'russe': 'ru', 'serbo-croatian': 'sh', 'shona': 'sn', 'sinhala': 'si',
  'spanish': 'es', 'espagnol': 'es', 'swahili': 'sw', 'swedish': 'sv',
  'suédois': 'sv', 'tagalog': 'tl', 'tamil': 'ta', 'thai': 'th',
  'turkish': 'tr', 'turc': 'tr', 'twi': 'tw', 'ukrainian': 'uk',
  'ukrainien': 'uk', 'urdu': 'ur', 'vietnamese': 'vi', 'welsh': 'cy',
  'yoruba': 'yo', 'bambara': 'bm', 'fula': 'ff', 'kirundi': 'rn',
  'kituba': 'kg', 'luganda': 'lg', 'sign language': 'sgn',
  'langue des signes': 'sgn', 'inuit': 'iu', 'inuktut': 'iu',
} as const;

/**
 * Resource type detection patterns.
 * Each key is a ResourceType, and the value is an array of RegExp patterns
 * matched against the combined URL + context text.
 * Order matters: first match wins, so more specific types (VIDEO, AUDIO) come first.
 */
export const TYPE_PATTERNS: Readonly<Record<string, ReadonlyArray<RegExp>>> = {
  VIDEO: [/youtube\.com/, /youtu\.be/, /vimeo\.com/, /video/i, /tv5monde/i, /nhk\.or/, /videoele/i],
  AUDIO: [/podcast/i, /audio/i, /spotify\.com/, /\.mp3/i, /itunes\.apple/, /podcasts\.apple/, /rfi\.fr/i, /radio/i],
  APP: [/duolingo\.com/, /memrise\.com/, /busuu\.com/, /babadum\.com/, /qioz\.fr/, /play\.google/, /apps\.apple/],
  BOOK: [/archive\.org/, /\.pdf/i, /textbook/i, /ebook/i],
  ARTICLE: [/wikipedia\.org/, /blog/i],
  WEBSITE: [],
} as const;

/**
 * Domains known to operate on a freemium model.
 * Used by UrlHeuristicStrategy as a first-pass signal (confidence 0.6).
 */
export const FREEMIUM_DOMAINS: ReadonlyArray<string> = [
  'duolingo.com', 'memrise.com', 'busuu.com', 'coursera.org',
] as const;

/**
 * Domains known to be fully premium / paid.
 * Currently empty — will be populated as we encounter premium-only services.
 */
export const PREMIUM_DOMAINS: ReadonlyArray<string> = [] as const;

/**
 * Domains to exclude from extraction.
 * These are navigation/social/meta links that are never language-learning resources.
 */
export const EXCLUDED_DOMAINS: ReadonlyArray<string> = [
  'reddit.com', 'redd.it', 'imgur.com', 'twitter.com', 'x.com',
  'facebook.com', 'instagram.com', 'linkedin.com', 'tiktok.com',
  'google.com', 'apple.com/app-store', 'play.google.com/store',
  'creativecommons.org', 'bpi.fr',
] as const;

/**
 * URL patterns to exclude from extraction.
 * Matches static assets, mailto links, javascript: URIs, and bare fragment links.
 */
export const EXCLUDED_PATTERNS: ReadonlyArray<RegExp> = [
  /\.(jpg|jpeg|png|gif|svg|ico|css|js|woff|ttf)$/i,
  /mailto:/i,
  /javascript:/i,
  /^#$/,
] as const;

/**
 * URL path segments that hint at premium/paid content.
 * Used by UrlHeuristicStrategy for path-based analysis.
 */
export const PREMIUM_URL_SEGMENTS: ReadonlyArray<string> = [
  '/pricing', '/premium', '/pro', '/subscribe', '/plans',
  '/upgrade', '/checkout', '/payment',
] as const;

/**
 * Keyword groups for DOM text analysis.
 * Each group maps to a pricing tier and is used by DomAnalysisStrategy
 * to score page content for pricing signals.
 */
export const PRICING_KEYWORDS = {
  FREE: [
    'free', 'gratuit', 'no cost', 'open source', 'libre',
    'no charge', 'gratis', 'complimentary', 'at no cost',
    'open access', 'creative commons', 'public domain',
  ],
  PREMIUM: [
    'subscribe', 'subscription', 'payant', 'premium', 'paid',
    'purchase', 'buy now', 'pricing plan', 'monthly plan',
    'annual plan', 'credit card', 'payment required',
    'unlock full', 'full access',
  ],
  FREEMIUM: [
    'free trial', 'freemium', 'basic plan', 'upgrade to pro',
    'free version', 'pour partie gratuit', 'limited free',
    'free tier', 'starter plan', 'upgrade',
  ],
} as const;
