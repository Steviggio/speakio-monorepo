// src/crawler/extractors/extractor.registry.ts

import type { Page } from 'playwright';
import type { Log } from '@apify/log';
import type { ExtractedLink } from '../../interfaces/extracted-data.interface.js';
import { extractReddit } from './reddit.extractor.js';
import { extractBPI } from './bpi.extractor.js';
import { extractFSI } from './fsi.extractor.js';
import { extractOpenCulture } from './openculture.extractor.js';
import { extractOmniglot } from './omniglot.extractor.js';
import { extractLanguagesGulper } from './languagesgulper.extractor.js';

/**
 * Function signature all extractors must conform to.
 * Each extractor receives the Playwright Page and Crawlee Log,
 * and returns a typed array of extracted links.
 */
export type ExtractorFunction = (page: Page, log: Log) => Promise<ExtractedLink[]>;

/**
 * Registry mapping source names to their dedicated extractor functions.
 *
 * Why a registry: Each source page has unique DOM structure, requiring
 * specialized extraction logic. The registry decouples the crawler's
 * request handler from the extraction implementation — adding a new
 * source only requires a new extractor file and a registry entry.
 */
export const EXTRACTOR_REGISTRY: Readonly<Record<string, ExtractorFunction>> = {
  reddit_languagelearning: extractReddit,
  bpi_selection_langues: extractBPI,
  fsi_languages: extractFSI,
  openculture_languages: extractOpenCulture,
  omniglot: extractOmniglot,
  languagesgulper: extractLanguagesGulper,
} as const;

/**
 * Retrieves the extractor function for a given source name.
 * Returns undefined if no extractor is registered for the source.
 */
export function getExtractor(sourceName: string): ExtractorFunction | undefined {
  return EXTRACTOR_REGISTRY[sourceName];
}
