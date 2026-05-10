// src/services/grouping/origin-grouper.service.ts

import type { ExtractedResource } from '../../interfaces/extracted-data.interface.js';
import type { OriginGroup, GroupedOutput, ExtractionSummary } from '../../interfaces/normalized-output.interface.js';

/**
 * Groups extracted resources by their origin for normalized frontend output.
 *
 * Grouping rule:
 * - Resources sharing the exact same `submittedBy` value belong to the same origin.
 * - Resources sharing the same DNS domain belong to the same origin.
 * - The origin key is computed as: `submittedBy || dnsDomain`.
 *
 * Why this grouping: The frontend needs to build dedicated provider pages
 * (e.g., "All resources from Duolingo") and filter by origin. Grouping
 * at extraction time avoids expensive client-side grouping on every render.
 */
export class OriginGrouperService {
  /**
   * Groups a flat array of resources into origin-based groups
   * and produces the final normalized output.
   *
   * @param resources - Flat array of enriched extracted resources.
   * @returns The fully grouped and summarized output structure.
   */
  public group(resources: ReadonlyArray<ExtractedResource>): GroupedOutput {
    const originMap = new Map<string, ExtractedResource[]>();

    for (const resource of resources) {
      const originKey = this.computeOriginKey(resource);

      const existing = originMap.get(originKey);
      if (existing) {
        existing.push(resource);
      } else {
        originMap.set(originKey, [resource]);
      }
    }

    const origins: OriginGroup[] = [];

    for (const [originKey, groupResources] of originMap.entries()) {
      /**
       * Derive the group-level domain and submittedBy from the first resource.
       * All resources in a group share either the same domain or submittedBy,
       * so the first resource is representative.
       */
      const representative = groupResources[0];

      origins.push({
        originKey,
        originDomain: representative.dnsDomain,
        submittedBy: representative.submittedBy,
        resourceCount: groupResources.length,
        resources: groupResources,
      });
    }

    // Sort origins by resource count descending for frontend display priority
    origins.sort((a, b) => b.resourceCount - a.resourceCount);

    const summary = this.computeSummary(resources);

    return {
      timestamp: new Date().toISOString(),
      totalResources: resources.length,
      totalOrigins: origins.length,
      origins,
      summary,
    };
  }

  /**
   * Computes the origin key for a resource.
   *
   * The primary grouping key is always the DNS domain — this ensures
   * resources from duolingo.com, memrise.com, etc. each get their own group
   * regardless of who submitted them.
   *
   * The submittedBy field is preserved in the group metadata for display
   * but does NOT drive the grouping key, because batch identifiers
   * like 'curation-scraper' or 'speakio' would collapse hundreds of
   * unrelated resources into a single group.
   *
   * Why DNS-first: The user's requirement is to build dedicated provider
   * pages (e.g., "All resources from Duolingo"). The DNS domain is the
   * most reliable proxy for "provider identity" when scraping third-party
   * curation lists.
   */
  private computeOriginKey(resource: ExtractedResource): string {
    const domain = resource.dnsDomain.trim();

    // DNS domain is the primary grouping signal
    if (domain && domain !== 'unknown') {
      return domain;
    }

    // Fallback: use submittedBy if DNS extraction failed
    const submittedBy = resource.submittedBy.trim();
    if (submittedBy) {
      return submittedBy;
    }

    return 'unknown';
  }

  /**
   * Computes aggregate statistics from the resource array.
   */
  private computeSummary(resources: ReadonlyArray<ExtractedResource>): ExtractionSummary {
    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byLanguage: Record<string, number> = {};
    const byPricing: Record<string, number> = {};

    for (const resource of resources) {
      // A resource can have multiple source tags
      for (const tag of resource.tags) {
        bySource[tag] = (bySource[tag] ?? 0) + 1;
      }
      byType[resource.type] = (byType[resource.type] ?? 0) + 1;
      byLanguage[resource.language] = (byLanguage[resource.language] ?? 0) + 1;
      byPricing[resource.pricing] = (byPricing[resource.pricing] ?? 0) + 1;
    }

    return { bySource, byType, byLanguage, byPricing };
  }
}
