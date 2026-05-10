// src/utils/url-parser.ts

/**
 * Safely extracts the registrable DNS domain from a URL string.
 * Strips the 'www.' prefix to normalize domains for grouping.
 *
 * Why a dedicated utility: URL parsing is a common source of runtime crashes
 * when scraping, because scraped URLs can be malformed, relative, or contain
 * unexpected schemes. Centralizing this with error handling prevents crashes
 * from propagating into the grouping and classification logic.
 *
 * @param rawUrl - The URL string to parse (may be malformed).
 * @returns The cleaned hostname (e.g., 'duolingo.com') or 'unknown' if parsing fails.
 */
export function parseDnsDomain(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return 'unknown';
  }

  try {
    const parsed = new URL(rawUrl);
    const hostname = parsed.hostname.toLowerCase();

    // Strip 'www.' prefix for consistent grouping
    // (www.duolingo.com and duolingo.com should map to the same origin)
    return hostname.startsWith('www.')
      ? hostname.slice(4)
      : hostname;
  } catch {
    // Malformed URLs from scraping are common — degrade gracefully
    return 'unknown';
  }
}

/**
 * Extracts the full hostname from a URL without stripping 'www.'.
 * Used when we need exact hostname matching (e.g., excluding source domains).
 *
 * @param rawUrl - The URL string to parse.
 * @returns The raw hostname or empty string if parsing fails.
 */
export function extractHostname(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '';
  }

  try {
    return new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return '';
  }
}

/**
 * Validates that a string is a well-formed absolute HTTP(S) URL.
 *
 * @param rawUrl - The string to validate.
 * @returns True if the string is a valid http/https URL.
 */
export function isValidHttpUrl(rawUrl: string): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Extracts the URL pathname for segment-level analysis.
 *
 * @param rawUrl - The URL string to parse.
 * @returns The pathname (e.g., '/pricing/pro') or '/' if parsing fails.
 */
export function extractPathname(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return '/';
  }

  try {
    return new URL(rawUrl).pathname.toLowerCase();
  } catch {
    return '/';
  }
}
