// src/services/detection/type-detector.service.ts

import { TYPE_PATTERNS } from '../../config/constants.js';
import type { ResourceType } from '../../interfaces/extracted-data.interface.js';

/**
 * Detects the ResourceType of a resource from its URL and surrounding text.
 *
 * The detection order matters: more specific types (VIDEO, AUDIO, APP) are
 * checked before generic ones (ARTICLE, WEBSITE). WEBSITE is the fallback
 * when no pattern matches, since most language resources are web-based.
 *
 * @param url - The resource URL.
 * @param text - The context text or title.
 * @returns The detected ResourceType.
 */
export function detectResourceType(url: string, text: string): ResourceType {
  const combined = `${url} ${text}`.toLowerCase();

  for (const [type, patterns] of Object.entries(TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(combined)) {
        return type as ResourceType;
      }
    }
  }

  return 'WEBSITE';
}
