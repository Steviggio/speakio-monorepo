// src/services/pricing/dom-analysis.strategy.ts

import type {
  IPricingStrategy,
  PricingEvaluationContext,
  PricingStrategyResult,
  PricingTier,
} from '../../interfaces/pricing-strategy.interface.js';
import { PRICING_KEYWORDS } from '../../config/constants.js';

/**
 * Scores tracked per pricing tier during keyword analysis.
 */
interface TierScore {
  tier: PricingTier;
  score: number;
  matchedKeywords: string[];
}

/**
 * Second-pass pricing strategy that analyzes the actual text content
 * of the page (or the context text extracted from the source listing).
 *
 * Why DOM analysis: URL heuristics can only classify known domains.
 * For the long tail of unknown sites, the actual page content is the
 * best signal. A page that says "free and open source" is almost
 * certainly FREE, even if we've never seen its domain before.
 *
 * This strategy:
 * 1. Tokenizes the pageText into lowercase.
 * 2. Counts occurrences of keywords for each tier (FREE, PREMIUM, FREEMIUM).
 * 3. Returns the tier with the highest score, or FREE as the default.
 * 4. Reports confidence of 0.8 when keywords are found (higher than URL heuristics),
 *    or 0.2 when no keywords match (acts as a weak FREE vote).
 */
export class DomAnalysisStrategy implements IPricingStrategy {
  public readonly name = 'DomAnalysisStrategy';

  /**
   * Confidence when keyword matches are found.
   * Higher than UrlHeuristicStrategy's 0.6 because actual content
   * is a stronger signal than URL structure alone.
   */
  private readonly KEYWORD_MATCH_CONFIDENCE = 0.8;

  /**
   * Confidence when no keywords are found.
   * Absence of pricing keywords weakly suggests FREE (most educational
   * resources don't prominently advertise being free — they just are).
   */
  private readonly NO_MATCH_CONFIDENCE = 0.2;

  /**
   * Minimum page text length to consider the analysis meaningful.
   * Very short texts (< 50 chars) are likely link anchors, not page content.
   */
  private readonly MIN_TEXT_LENGTH = 50;

  public evaluate(context: PricingEvaluationContext): PricingStrategyResult {
    const { pageText } = context;

    // Guard: insufficient text to analyze
    if (!pageText || pageText.length < this.MIN_TEXT_LENGTH) {
      return {
        tier: 'FREE',
        confidence: 0.1,
        reasoning: `Page text too short (${pageText?.length ?? 0} chars) for meaningful analysis. Defaulting to FREE.`,
      };
    }

    const lowerText = pageText.toLowerCase();

    // Score each tier by counting keyword matches
    const scores: TierScore[] = [
      this.scoreTier('FREE', lowerText),
      this.scoreTier('PREMIUM', lowerText),
      this.scoreTier('FREEMIUM', lowerText),
    ];

    // Sort by score descending — highest score wins
    scores.sort((a, b) => b.score - a.score);

    const winner = scores[0];

    // No keywords found at all — weak FREE default
    if (winner.score === 0) {
      return {
        tier: 'FREE',
        confidence: this.NO_MATCH_CONFIDENCE,
        reasoning: 'No pricing keywords detected in page text. Defaulting to FREE.',
      };
    }

    /**
     * Freemium resolution: if both FREE and PREMIUM keywords are present
     * with similar scores, the resource is likely FREEMIUM (free with paid upgrades).
     * This handles pages that say "Free to start, upgrade for premium features".
     */
    const freeScore = scores.find((s) => s.tier === 'FREE')?.score ?? 0;
    const premiumScore = scores.find((s) => s.tier === 'PREMIUM')?.score ?? 0;

    if (freeScore > 0 && premiumScore > 0 && winner.tier !== 'FREEMIUM') {
      const ratio = Math.min(freeScore, premiumScore) / Math.max(freeScore, premiumScore);
      // If both tiers have non-trivial scores (ratio > 0.3), it's likely freemium
      if (ratio > 0.3) {
        return {
          tier: 'FREEMIUM',
          confidence: this.KEYWORD_MATCH_CONFIDENCE * 0.9,
          reasoning: `Both FREE (${freeScore}) and PREMIUM (${premiumScore}) keywords detected. Ratio ${ratio.toFixed(2)} suggests FREEMIUM.`,
        };
      }
    }

    return {
      tier: winner.tier,
      confidence: this.KEYWORD_MATCH_CONFIDENCE,
      reasoning: `Tier "${winner.tier}" won with score ${winner.score}. Keywords: [${winner.matchedKeywords.join(', ')}].`,
    };
  }

  /**
   * Counts how many keywords from a given tier's keyword list appear in the text.
   * Returns the total count and the list of matched keywords for audit.
   */
  private scoreTier(tier: PricingTier, lowerText: string): TierScore {
    const keywords = PRICING_KEYWORDS[tier];
    const matchedKeywords: string[] = [];
    let score = 0;

    for (const keyword of keywords) {
      // Count occurrences rather than just presence for weighted scoring
      const regex = new RegExp(this.escapeRegex(keyword), 'gi');
      const matches = lowerText.match(regex);
      if (matches) {
        score += matches.length;
        matchedKeywords.push(`${keyword}(×${matches.length})`);
      }
    }

    return { tier, score, matchedKeywords };
  }

  /**
   * Escapes special regex characters in keyword strings
   * so they can be used safely in RegExp constructors.
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}
