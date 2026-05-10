// src/utils/text-cleaner.ts

/**
 * Maximum length for cleaned title strings.
 * Prevents excessively long titles from DOM extraction
 * from bloating the output JSON.
 */
const MAX_TITLE_LENGTH = 200;

/**
 * Maximum length for description/context strings.
 */
const MAX_DESCRIPTION_LENGTH = 500;

/**
 * Cleans and normalizes a title string extracted from the DOM.
 * Collapses whitespace, removes control characters, and truncates.
 *
 * @param text - The raw title text from the DOM.
 * @returns A cleaned, human-readable title string.
 */
export function cleanTitle(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, MAX_TITLE_LENGTH);
}

/**
 * Cleans and normalizes a description or context string.
 * Similar to cleanTitle but with a higher length limit.
 *
 * @param text - The raw context/description text.
 * @returns A cleaned description string.
 */
export function cleanDescription(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, MAX_DESCRIPTION_LENGTH);
}

/**
 * Normalizes a URL by stripping trailing slashes and lowercasing
 * for deduplication comparisons.
 *
 * @param url - The URL to normalize.
 * @returns The normalized URL string.
 */
export function normalizeUrlForDedup(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  return url.replace(/\/+$/, '').toLowerCase();
}
