// src/interfaces/pricing-strategy.interface.ts

/**
 * Pricing tiers mirroring the shared @speakio/types Pricing enum.
 * Defined locally to keep the scraper self-contained without workspace linking.
 */
export const PRICING_TIERS = ['FREE', 'FREEMIUM', 'PREMIUM'] as const;
export type PricingTier = (typeof PRICING_TIERS)[number];

/**
 * Context object passed to each pricing strategy for evaluation.
 * Carries all available signals so strategies can pick what they need.
 */
export interface PricingEvaluationContext {
  /** The fully-qualified URL of the resource being classified. */
  readonly url: string;
  /** The innerText or context text extracted from the page or source listing. */
  readonly pageText: string;
  /** The hostname parsed from the URL (pre-computed for convenience). */
  readonly hostname: string;
  /** The source from which this resource was discovered (e.g., 'reddit_languagelearning'). */
  readonly sourceName: string;
}

/**
 * Result returned by a single pricing strategy evaluation.
 * The confidence score allows the pipeline to resolve conflicts
 * when multiple strategies disagree on the tier.
 */
export interface PricingStrategyResult {
  /** The pricing tier this strategy determined. */
  readonly tier: PricingTier;
  /**
   * Confidence in the determination, from 0.0 (pure guess) to 1.0 (definitive).
   * Used by the pipeline to weight conflicting results.
   */
  readonly confidence: number;
  /** Human-readable explanation of why this tier was chosen (for audit trails). */
  readonly reasoning: string;
}

/**
 * Contract for all pricing classification strategies.
 * Each strategy inspects one signal dimension (URL patterns, DOM text, etc.)
 * and returns an independent classification with a confidence score.
 *
 * Why an interface: The Strategy Pattern lets us add new heuristics (e.g., an LLM-based
 * classifier) without modifying the pipeline orchestrator, respecting Open/Closed Principle.
 */
export interface IPricingStrategy {
  /** Unique name identifying this strategy in audit logs. */
  readonly name: string;
  /** Evaluate the context and produce a pricing classification. */
  evaluate(context: PricingEvaluationContext): PricingStrategyResult;
}

/**
 * Final resolved pricing result after the pipeline has run all strategies.
 * Includes the full audit trail for transparency and debugging.
 */
export interface PricingPipelineResult {
  /** The winning pricing tier after conflict resolution. */
  readonly tier: PricingTier;
  /** Overall confidence of the final determination. */
  readonly confidence: number;
  /** Ordered list of every strategy's individual result. */
  readonly strategyResults: ReadonlyArray<{
    readonly strategyName: string;
    readonly result: PricingStrategyResult;
  }>;
}
