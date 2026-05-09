// src/interfaces/normalized-output.interface.ts

import type { ExtractedResource } from './extracted-data.interface.js';

/**
 * A single origin group in the normalized output.
 * Resources are grouped when they share the same SubmittedBy value
 * OR the same DNS domain, enabling the frontend to build dedicated
 * provider pages and streamline user routing.
 */
export interface OriginGroup {
  /**
   * Computed key that uniquely identifies this origin group.
   * Derived from: submittedBy if shared, otherwise the DNS domain.
   */
  readonly originKey: string;
  /** The DNS domain shared by resources in this group (e.g., 'duolingo.com'). */
  readonly originDomain: string;
  /** The submittedBy value shared by resources in this group. */
  readonly submittedBy: string;
  /** Total number of resources in this origin group. */
  readonly resourceCount: number;
  /** The resources belonging to this origin. */
  readonly resources: ReadonlyArray<ExtractedResource>;
}

/**
 * Top-level output structure saved to the Crawlee Dataset.
 * Groups all extracted resources by origin for frontend consumption.
 */
export interface GroupedOutput {
  /** ISO 8601 timestamp of when this extraction run completed. */
  readonly timestamp: string;
  /** Total number of unique resources across all origin groups. */
  readonly totalResources: number;
  /** Total number of distinct origin groups. */
  readonly totalOrigins: number;
  /** Resources grouped by origin (shared DNS domain or submittedBy). */
  readonly origins: ReadonlyArray<OriginGroup>;
  /** Summary statistics for quick inspection. */
  readonly summary: ExtractionSummary;
}

/**
 * Aggregate statistics computed from the extraction run.
 */
export interface ExtractionSummary {
  /** Count of resources per source name tag. */
  readonly bySource: Readonly<Record<string, number>>;
  /** Count of resources per ResourceType. */
  readonly byType: Readonly<Record<string, number>>;
  /** Count of resources per ISO 639-1 language code. */
  readonly byLanguage: Readonly<Record<string, number>>;
  /** Count of resources per PricingTier. */
  readonly byPricing: Readonly<Record<string, number>>;
}
