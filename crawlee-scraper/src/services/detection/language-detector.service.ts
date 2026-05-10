// src/services/detection/language-detector.service.ts

import { LANGUAGE_MAP } from '../../config/constants.js';

/**
 * Detects the ISO 639-1 language code from combined context text and URL.
 *
 * Why combined input: Language names can appear in either the visible text
 * (e.g., "Learn Spanish") or the URL path (e.g., /spanish/lesson1.html).
 * Combining both maximizes detection coverage across heterogeneous sources.
 *
 * @param text - The context text or title surrounding the resource link.
 * @param url - The resource URL.
 * @returns An ISO 639-1 code (e.g., 'es') or 'multi' if no specific language detected.
 */
export function detectLanguage(text: string, url: string): string {
  const combined = `${text} ${url}`.toLowerCase();

  for (const [pattern, code] of Object.entries(LANGUAGE_MAP)) {
    if (combined.includes(pattern)) {
      return code;
    }
  }

  return 'multi';
}
