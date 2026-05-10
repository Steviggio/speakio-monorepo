// src/crawler/resource-crawler.ts

import { PlaywrightCrawler, Dataset } from 'crawlee';
import type { CurationSource } from '../config/sources.js';
import { EXCLUDED_DOMAINS, EXCLUDED_PATTERNS } from '../config/constants.js';
import type { ExtractedLink, ExtractedResource } from '../interfaces/extracted-data.interface.js';
import { getExtractor } from './extractors/extractor.registry.js';
import { PricingPipelineService } from '../services/pricing/pricing-pipeline.service.js';
import { detectLanguage } from '../services/detection/language-detector.service.js';
import { detectResourceType } from '../services/detection/type-detector.service.js';
import { parseDnsDomain, extractHostname, isValidHttpUrl } from '../utils/url-parser.js';
import { cleanTitle, cleanDescription, normalizeUrlForDedup } from '../utils/text-cleaner.js';

/**
 * Determines whether a URL should be excluded from extraction results.
 *
 * Exclusion criteria:
 * 1. Not a valid HTTP(S) URL.
 * 2. Points back to the source page itself (self-referential).
 * 3. Matches a known excluded domain (social media, app stores, etc.).
 * 4. Matches an excluded pattern (static assets, mailto, javascript:).
 */
function shouldExcludeUrl(url: string, sourceUrl: string): boolean {
  if (!isValidHttpUrl(url)) {
    return true;
  }

  const hostname = extractHostname(url);
  const sourceHostname = extractHostname(sourceUrl);

  // Exclude self-referential links back to the source page
  if (hostname === sourceHostname) {
    return true;
  }

  // Exclude known non-resource domains
  if (EXCLUDED_DOMAINS.some((domain) => hostname.includes(domain))) {
    return true;
  }

  // Exclude static assets and non-HTTP URIs
  if (EXCLUDED_PATTERNS.some((pattern) => pattern.test(url))) {
    return true;
  }

  return false;
}

/**
 * Determines whether directory listing metadata headers from FSI
 * should be filtered out (e.g., 'Name', 'Last modified', 'Parent Directory').
 */
function isFsiMetadataLink(title: string): boolean {
  const fsiMetaTitles = ['Name', 'Last modified', 'Size', 'Description', 'Parent Directory'];
  return fsiMetaTitles.includes(title);
}

/**
 * Sources that are primarily internal resource encyclopedias.
 * These sites' own links ARE the resources, so we don't exclude
 * same-domain links for them (unlike aggregator pages like Reddit/BPI).
 */
const INTERNAL_RESOURCE_SOURCES = new Set(['omniglot', 'languagesgulper']);

/**
 * Crawls a single curation source and returns enriched resources.
 *
 * Flow:
 * 1. Set up a PlaywrightCrawler targeting the source URL.
 * 2. Delegate DOM extraction to the source-specific extractor.
 * 3. Filter out excluded/invalid links.
 * 4. Enrich each link with type, language, and multi-strategy pricing.
 * 5. Deduplicate by normalized URL.
 * 6. Return the enriched resource array.
 */
export async function crawlSource(
  source: CurationSource,
  pricingPipeline: PricingPipelineService
): Promise<ExtractedResource[]> {
  const sourceResources: ExtractedResource[] = [];

  const crawler = new PlaywrightCrawler({
    requestHandlerTimeoutSecs: 120,
    maxConcurrency: 1,
    headless: true,
    launchContext: {
      launchOptions: {
        args: ['--disable-blink-features=AutomationControlled'],
      },
    },

    async requestHandler({ page, log }) {
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      // Look up the correct extractor for this source
      const extractor = getExtractor(source.name);
      if (!extractor) {
        log.warning(`No extractor registered for source: ${source.name}. Skipping.`);
        return;
      }

      const rawLinks: ExtractedLink[] = await extractor(page, log);
      log.info(`Raw links extracted: ${rawLinks.length}`);

      const isInternalResourceSite = INTERNAL_RESOURCE_SOURCES.has(source.name);
      const isFSI = source.name === 'fsi_languages';

      for (const link of rawLinks) {
        // Apply URL exclusion rules (skip for internal resource sites and FSI)
        if (!isInternalResourceSite && !isFSI && shouldExcludeUrl(link.url, source.url)) {
          continue;
        }

        // Skip links with no meaningful title
        if (!link.title || link.title.length < 2) {
          continue;
        }

        // Skip FSI directory listing metadata headers
        if (isFSI && isFsiMetadataLink(link.title)) {
          continue;
        }

        const contextText = link.context || link.title;

        /**
         * Run the multi-strategy pricing pipeline.
         * This is where the URL-only limitation of the old scraper is resolved:
         * both URL heuristics AND content analysis contribute to the final tier.
         */
        const pricingResult = pricingPipeline.classify(
          link.url,
          contextText,
          source.name
        );

        const resource: ExtractedResource = {
          title: cleanTitle(link.title),
          description: link.context
            ? cleanDescription(link.context)
            : source.description,
          url: link.url,
          type: detectResourceType(link.url, contextText),
          language: detectLanguage(contextText, link.url),
          tags: [source.name],
          pricing: pricingResult.tier,
          pricingConfidence: pricingResult.confidence,
          pricingAudit: pricingResult.strategyResults.map((sr) => ({
            strategyName: sr.strategyName,
            tier: sr.result.tier,
            confidence: sr.result.confidence,
            reasoning: sr.result.reasoning,
          })),
          submittedBy: 'curation-scraper',
          dnsDomain: parseDnsDomain(link.url),
        };

        sourceResources.push(resource);
      }
    },

    failedRequestHandler({ request, log }) {
      log.error(`Failed to scrape ${request.url}: request failed after retries.`);
    },
  });

  try {
    await crawler.run([source.url]);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Error processing source "${source.name}":`, message);
  }

  // Deduplicate by normalized URL within this source
  const seen = new Set<string>();
  const dedupedResources = sourceResources.filter((resource) => {
    const normalized = normalizeUrlForDedup(resource.url);
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });

  return dedupedResources;
}

/**
 * Merges resources from multiple sources, deduplicating globally.
 * When the same URL appears in multiple sources, the tags are merged
 * to preserve the provenance trail.
 */
export function mergeResources(
  resourceArrays: ReadonlyArray<ReadonlyArray<ExtractedResource>>
): ExtractedResource[] {
  const globalSeen = new Map<string, ExtractedResource>();

  for (const resources of resourceArrays) {
    for (const resource of resources) {
      const normalizedUrl = normalizeUrlForDedup(resource.url);

      const existing = globalSeen.get(normalizedUrl);
      if (existing) {
        /**
         * Merge tags when the same URL is found across multiple sources.
         * This preserves the fact that "Duolingo" was listed on both Reddit and BPI.
         */
        const mergedTags = [...new Set([...existing.tags, ...resource.tags])];
        globalSeen.set(normalizedUrl, { ...existing, tags: mergedTags });
      } else {
        globalSeen.set(normalizedUrl, resource);
      }
    }
  }

  return Array.from(globalSeen.values());
}

/**
 * Saves the grouped output to both Crawlee's Dataset and a plain JSON file.
 */
export async function saveToDataset(data: Record<string, unknown>): Promise<void> {
  const dataset = await Dataset.open('grouped-resources');
  await dataset.pushData(data);
}
