// src/services/pricing/url-heuristic.strategy.ts

import type {
  IPricingStrategy,
  PricingEvaluationContext,
  PricingStrategyResult,
} from '../../interfaces/pricing-strategy.interface.js';
import { FREEMIUM_DOMAINS, PREMIUM_DOMAINS, PREMIUM_URL_SEGMENTS } from '../../config/constants.js';
import { extractPathname } from '../../utils/url-parser.js';

/**
 * First-pass pricing strategy that evaluates URL structure only.
 *
 * Why URL-first: Domain lists are the fastest, cheapest signal to check.
 * Known platforms like Duolingo or Coursera can be classified with high
 * certainty from the hostname alone. Curated domain matches get 0.85
 * confidence (above DOM analysis's 0.8) because they represent editorially
 * verified knowledge about a platform's pricing model.
 *
 * This strategy checks:
 * 1. The hostname against known FREEMIUM and PREMIUM domain lists.
 * 2. The URL path for pricing-related segments (e.g., '/pricing', '/premium').
 */
export class UrlHeuristicStrategy implements IPricingStrategy {
  public readonly name = 'UrlHeuristicStrategy';

  /**
   * Confidence for matches against our curated domain lists.
   * Set ABOVE DomAnalysisStrategy's 0.8 because a curated domain list
   * is a higher-quality signal than generic keyword matching.
   * When we know duolingo.com is freemium, a BPI description saying
   * "gratuit" (describing the listing, not the actual platform) should
   * not override our curated classification.
   */
  private readonly DOMAIN_MATCH_CONFIDENCE = 0.85;

  /**
   * Lower confidence for path-segment-only matches.
   * Path segments like '/pricing' are suggestive but not definitive
   * (could be an informational page about pricing philosophy).
   */
  private readonly PATH_MATCH_CONFIDENCE = 0.5;

  public evaluate(context: PricingEvaluationContext): PricingStrategyResult {
    const { hostname, url } = context;

    // Check domain lists first — strongest URL-based signal
    const isFreemiumDomain = FREEMIUM_DOMAINS.some(
      (domain) => hostname.includes(domain)
    );
    if (isFreemiumDomain) {
      return {
        tier: 'FREEMIUM',
        confidence: this.DOMAIN_MATCH_CONFIDENCE,
        reasoning: `Hostname "${hostname}" matches known freemium domain list.`,
      };
    }

    const isPremiumDomain = PREMIUM_DOMAINS.some(
      (domain) => hostname.includes(domain)
    );
    if (isPremiumDomain) {
      return {
        tier: 'PREMIUM',
        confidence: this.DOMAIN_MATCH_CONFIDENCE,
        reasoning: `Hostname "${hostname}" matches known premium domain list.`,
      };
    }

    // Check URL path for pricing-related segments
    const pathname = extractPathname(url);
    const matchedSegment = PREMIUM_URL_SEGMENTS.find(
      (segment) => pathname.includes(segment)
    );
    if (matchedSegment) {
      return {
        tier: 'PREMIUM',
        confidence: this.PATH_MATCH_CONFIDENCE,
        reasoning: `URL path contains pricing segment "${matchedSegment}".`,
      };
    }

    // No URL-based signal found — default to FREE with low confidence
    return {
      tier: 'FREE',
      confidence: 0.3,
      reasoning: 'No premium or freemium signals detected in URL structure.',
    };
  }
}
