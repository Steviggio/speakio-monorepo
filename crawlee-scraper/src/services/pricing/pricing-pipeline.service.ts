// src/services/pricing/pricing-pipeline.service.ts

import type {
  IPricingStrategy,
  PricingEvaluationContext,
  PricingPipelineResult,
  PricingTier,
} from '../../interfaces/pricing-strategy.interface.js';
import { extractHostname } from '../../utils/url-parser.js';

/**
 * Orchestrates multiple pricing strategies in a defined order,
 * collects their results, and resolves conflicts using confidence-weighted voting.
 *
 * Why a pipeline: No single heuristic reliably classifies pricing across
 * the diversity of language-learning sites. The pipeline architecture lets
 * each strategy contribute an independent signal, and the orchestrator
 * resolves disagreements based on which strategy is more confident.
 *
 * Resolution algorithm:
 * 1. Run all strategies and collect (tier, confidence) results.
 * 2. If all strategies agree, use that tier with max confidence.
 * 3. If strategies disagree, the highest-confidence result wins.
 * 4. On a confidence tie, the later strategy (more specific) takes priority.
 *
 * Adding a new heuristic (e.g., LLM-based) only requires implementing
 * IPricingStrategy and registering it in the strategies array.
 */
export class PricingPipelineService {
  private readonly strategies: ReadonlyArray<IPricingStrategy>;

  constructor(strategies: ReadonlyArray<IPricingStrategy>) {
    if (strategies.length === 0) {
      throw new Error('PricingPipelineService requires at least one strategy.');
    }
    this.strategies = strategies;
  }

  /**
   * Classifies the pricing tier of a resource by running all registered strategies.
   *
   * @param url - The resource URL to classify.
   * @param pageText - The page text or context text for content analysis.
   * @param sourceName - The source that discovered this resource.
   * @returns The resolved pricing result with full audit trail.
   */
  public classify(url: string, pageText: string, sourceName: string): PricingPipelineResult {
    const hostname = extractHostname(url);

    const context: PricingEvaluationContext = {
      url,
      pageText,
      hostname,
      sourceName,
    };

    // Collect results from every strategy in registration order
    const strategyResults: Array<{
      strategyName: string;
      result: ReturnType<IPricingStrategy['evaluate']>;
    }> = [];

    for (const strategy of this.strategies) {
      try {
        const result = strategy.evaluate(context);
        strategyResults.push({
          strategyName: strategy.name,
          result,
        });
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        // A failing strategy should not crash the pipeline — log and skip
        strategyResults.push({
          strategyName: strategy.name,
          result: {
            tier: 'FREE',
            confidence: 0,
            reasoning: `Strategy threw an error: ${message}. Ignored.`,
          },
        });
      }
    }

    // Resolve the winning tier using confidence-weighted priority
    const resolved = this.resolveConflicts(strategyResults);

    return {
      tier: resolved.tier,
      confidence: resolved.confidence,
      strategyResults,
    };
  }

  /**
   * Resolves conflicting strategy results.
   *
   * Algorithm:
   * - Sort by confidence descending.
   * - On confidence ties, the later strategy (higher index in the original array)
   *   wins because later strategies are assumed to be more specific/accurate.
   */
  private resolveConflicts(
    results: ReadonlyArray<{
      strategyName: string;
      result: { tier: PricingTier; confidence: number };
    }>
  ): { tier: PricingTier; confidence: number } {
    if (results.length === 0) {
      return { tier: 'FREE', confidence: 0 };
    }

    // Find the result with the highest confidence.
    // On ties, the later strategy wins (its index is higher, making it "more specific").
    let bestIndex = 0;
    let bestConfidence = results[0].result.confidence;

    for (let i = 1; i < results.length; i++) {
      const currentConfidence = results[i].result.confidence;
      // >= ensures later strategies win on ties (they are more specific/targeted)
      if (currentConfidence >= bestConfidence) {
        bestIndex = i;
        bestConfidence = currentConfidence;
      }
    }

    return {
      tier: results[bestIndex].result.tier,
      confidence: bestConfidence,
    };
  }
}
