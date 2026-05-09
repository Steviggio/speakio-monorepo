// src/interfaces/extracted-data.interface.ts

/**
 * Raw shape of a single link extracted from a source page's DOM.
 * This is the output of each site-specific extractor before any classification.
 */
export interface ExtractedLink {
  /** The absolute URL found in the DOM anchor element. */
  readonly url: string;
  /** The visible text of the anchor element (cleaned). */
  readonly title: string;
  /**
   * Surrounding context text from the DOM (parent paragraph, list item, section heading).
   * Used downstream by pricing classification, language detection, and type detection.
   */
  readonly context: string;
}

/**
 * Resource types mirroring the shared @speakio/types ResourceType enum.
 * Local definition keeps the scraper independent of workspace linking.
 */
export const RESOURCE_TYPES = ['BOOK', 'AUDIO', 'VIDEO', 'APP', 'CHAT', 'ARTICLE', 'WEBSITE'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

/**
 * Enriched resource after detection services and pricing pipeline have been applied.
 * This is the intermediate shape before origin grouping transforms it into the final output.
 */
export interface ExtractedResource {
  /** Cleaned title of the resource. */
  readonly title: string;
  /** Description or context snippet (max 500 chars). */
  readonly description: string;
  /** Fully-qualified URL. */
  readonly url: string;
  /** Content type classification. */
  readonly type: ResourceType;
  /** ISO 639-1 language code, or 'multi' for multi-language resources. */
  readonly language: string;
  /** Tags identifying the source(s) that listed this resource. */
  readonly tags: string[];
  /** Pricing tier as determined by the multi-strategy pipeline. */
  readonly pricing: string;
  /** Confidence score of the pricing classification (0.0 - 1.0). */
  readonly pricingConfidence: number;
  /** Audit trail of the pricing classification strategies used. */
  readonly pricingAudit: ReadonlyArray<{
    readonly strategyName: string;
    readonly tier: string;
    readonly confidence: number;
    readonly reasoning: string;
  }>;
  /** Who or what submitted/discovered this resource. */
  readonly submittedBy: string;
  /** The DNS domain parsed from the resource URL. */
  readonly dnsDomain: string;
}
