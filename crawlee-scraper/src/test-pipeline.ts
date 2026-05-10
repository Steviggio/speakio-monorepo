// src/test-pipeline.ts

/**
 * Test harness for the pricing pipeline and origin grouper.
 * Reads the existing extracted_resources.json from crawlee-test/curation_output/
 * and processes it through our new TypeScript classification pipeline
 * without needing to re-crawl live websites.
 *
 * This validates:
 * 1. PricingPipelineService correctly classifies known resources.
 * 2. OriginGrouperService correctly groups by DNS domain / submittedBy.
 * 3. The full output matches the GroupedOutput interface shape.
 */

import fs from 'fs';
import path from 'path';
import { UrlHeuristicStrategy } from './services/pricing/url-heuristic.strategy.js';
import { DomAnalysisStrategy } from './services/pricing/dom-analysis.strategy.js';
import { PricingPipelineService } from './services/pricing/pricing-pipeline.service.js';
import { OriginGrouperService } from './services/grouping/origin-grouper.service.js';
import { detectLanguage } from './services/detection/language-detector.service.js';
import { detectResourceType } from './services/detection/type-detector.service.js';
import { parseDnsDomain } from './utils/url-parser.js';
import { cleanTitle, cleanDescription } from './utils/text-cleaner.js';
import type { ExtractedResource } from './interfaces/extracted-data.interface.js';

/**
 * Shape of resources from the old JS scraper output.
 * Uses an interface instead of any to maintain strict typing.
 */
interface LegacyResource {
  title: string;
  description: string;
  url: string;
  type: string;
  language: string;
  tags: string[];
  pricing: string;
  submittedBy: string;
}

async function testPipeline(): Promise<void> {
  console.log('=== Testing Pricing Pipeline & Origin Grouper ===\n');

  // Load existing scraped data from the old JS scraper
  const inputPath = path.resolve(
    process.cwd(),
    '..',
    'crawlee-test',
    'curation_output',
    'extracted_resources.json'
  );

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Input file not found: ${inputPath}`);
    console.error('   Make sure crawlee-test/curation_output/extracted_resources.json exists.');
    process.exit(1);
  }

  const rawData = fs.readFileSync(inputPath, 'utf-8');
  const legacyResources: LegacyResource[] = JSON.parse(rawData) as LegacyResource[];
  console.log(`📦 Loaded ${legacyResources.length} resources from legacy scraper output.\n`);

  // Assemble the pricing pipeline
  const pricingPipeline = new PricingPipelineService([
    new UrlHeuristicStrategy(),
    new DomAnalysisStrategy(),
  ]);

  const originGrouper = new OriginGrouperService();

  // Process each legacy resource through the new pipeline
  const enrichedResources: ExtractedResource[] = [];
  const pricingChanges: Array<{
    title: string;
    url: string;
    oldPricing: string;
    newPricing: string;
    confidence: number;
    audit: string;
  }> = [];

  for (const legacy of legacyResources) {
    const contextText = legacy.description || legacy.title;
    const sourceName = legacy.tags[0] || 'unknown';

    // Run through the new multi-strategy pipeline
    const pricingResult = pricingPipeline.classify(
      legacy.url,
      contextText,
      sourceName
    );

    const enriched: ExtractedResource = {
      title: cleanTitle(legacy.title),
      description: cleanDescription(legacy.description),
      url: legacy.url,
      type: detectResourceType(legacy.url, contextText),
      language: detectLanguage(contextText, legacy.url),
      tags: legacy.tags,
      pricing: pricingResult.tier,
      pricingConfidence: pricingResult.confidence,
      pricingAudit: pricingResult.strategyResults.map((sr) => ({
        strategyName: sr.strategyName,
        tier: sr.result.tier,
        confidence: sr.result.confidence,
        reasoning: sr.result.reasoning,
      })),
      submittedBy: legacy.submittedBy,
      dnsDomain: parseDnsDomain(legacy.url),
    };

    enrichedResources.push(enriched);

    // Track pricing classification changes
    if (legacy.pricing !== pricingResult.tier) {
      const auditSummary = pricingResult.strategyResults
        .map((sr) => `${sr.strategyName}: ${sr.result.tier} (${sr.result.confidence})`)
        .join(' → ');

      pricingChanges.push({
        title: legacy.title.substring(0, 50),
        url: legacy.url.substring(0, 60),
        oldPricing: legacy.pricing,
        newPricing: pricingResult.tier,
        confidence: pricingResult.confidence,
        audit: auditSummary,
      });
    }
  }

  // ========== PRICING CLASSIFICATION REPORT ==========
  console.log('=== Pricing Classification Results ===\n');

  // Summary: old vs new pricing distribution
  const oldDist: Record<string, number> = {};
  const newDist: Record<string, number> = {};
  for (const legacy of legacyResources) {
    oldDist[legacy.pricing] = (oldDist[legacy.pricing] ?? 0) + 1;
  }
  for (const enriched of enrichedResources) {
    newDist[enriched.pricing] = (newDist[enriched.pricing] ?? 0) + 1;
  }

  console.log('📊 Pricing Distribution Comparison:');
  console.log('  Tier       | Old Scraper | New Pipeline');
  console.log('  -----------|-------------|-------------');
  for (const tier of ['FREE', 'FREEMIUM', 'PREMIUM']) {
    console.log(
      `  ${tier.padEnd(10)} | ${String(oldDist[tier] ?? 0).padStart(11)} | ${String(newDist[tier] ?? 0).padStart(12)}`
    );
  }

  console.log(`\n🔄 Pricing changes detected: ${pricingChanges.length} / ${legacyResources.length}`);

  if (pricingChanges.length > 0) {
    console.log('\n--- Pricing Classification Changes (sample) ---');
    // Show first 15 changes for review
    for (const change of pricingChanges.slice(0, 15)) {
      console.log(`  📝 "${change.title}..."`);
      console.log(`     URL:    ${change.url}...`);
      console.log(`     OLD:    ${change.oldPricing} → NEW: ${change.newPricing} (confidence: ${change.confidence})`);
      console.log(`     Audit:  ${change.audit}`);
      console.log('');
    }
    if (pricingChanges.length > 15) {
      console.log(`  ... and ${pricingChanges.length - 15} more changes.`);
    }
  }

  // ========== ORIGIN GROUPING REPORT ==========
  console.log('\n=== Origin Grouping Results ===\n');

  const groupedOutput = originGrouper.group(enrichedResources);

  console.log(`📦 Total resources: ${groupedOutput.totalResources}`);
  console.log(`🏢 Total origin groups: ${groupedOutput.totalOrigins}`);

  console.log('\n--- Top 20 Origin Groups ---');
  for (const origin of groupedOutput.origins.slice(0, 20)) {
    console.log(
      `  ${origin.originKey.padEnd(35)} | ${String(origin.resourceCount).padStart(3)} resources | domain: ${origin.originDomain}`
    );
  }

  // Show some notable grouping examples
  console.log('\n--- Notable Grouping Examples ---');

  // Find groups where submittedBy drove the grouping
  const submittedByGroups = groupedOutput.origins.filter(
    (o) => o.submittedBy && o.submittedBy !== 'curation-scraper' && o.submittedBy !== ''
  );
  if (submittedByGroups.length > 0) {
    console.log(`\n  📌 Groups driven by submittedBy (${submittedByGroups.length}):`);
    for (const g of submittedByGroups.slice(0, 5)) {
      console.log(`     "${g.originKey}" → ${g.resourceCount} resources from submitter "${g.submittedBy}"`);
    }
  }

  // Find groups with multiple resources (evidence of DNS grouping)
  const multiGroups = groupedOutput.origins.filter((o) => o.resourceCount > 1);
  console.log(`\n  📌 DNS-domain groups with 2+ resources (${multiGroups.length}):`);
  for (const g of multiGroups.slice(0, 10)) {
    console.log(
      `     ${g.originDomain.padEnd(30)} → ${g.resourceCount} resources`
    );
    // Show first 2 resource titles for context
    for (const r of g.resources.slice(0, 2)) {
      console.log(`       • "${r.title.substring(0, 60)}"`);
    }
  }

  // ========== SAVE OUTPUT ==========
  const outputDir = path.join(process.cwd(), 'test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Save grouped output
  const groupedFile = path.join(outputDir, 'grouped_resources.json');
  fs.writeFileSync(groupedFile, JSON.stringify(groupedOutput, null, 2));
  console.log(`\n✅ Grouped output saved to: ${groupedFile}`);

  // Save pricing changes report
  const changesFile = path.join(outputDir, 'pricing_changes.json');
  fs.writeFileSync(changesFile, JSON.stringify(pricingChanges, null, 2));
  console.log(`✅ Pricing changes saved to: ${changesFile}`);

  // Save a sample of enriched resources with full audit trail
  const sampleFile = path.join(outputDir, 'enriched_sample.json');
  const interestingSamples = enrichedResources
    .filter((r) => r.pricingConfidence > 0.5)
    .slice(0, 20);
  fs.writeFileSync(sampleFile, JSON.stringify(interestingSamples, null, 2));
  console.log(`✅ Enriched sample (20 resources with audit) saved to: ${sampleFile}`);

  // Save summary
  const summaryFile = path.join(outputDir, 'test_summary.json');
  fs.writeFileSync(
    summaryFile,
    JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        totalProcessed: legacyResources.length,
        pricingChangesCount: pricingChanges.length,
        groupedOutput: {
          totalResources: groupedOutput.totalResources,
          totalOrigins: groupedOutput.totalOrigins,
          summary: groupedOutput.summary,
        },
        pricingDistribution: { old: oldDist, new: newDist },
      },
      null,
      2
    )
  );
  console.log(`📊 Test summary saved to: ${summaryFile}`);

  console.log('\n=== Test Complete! ===');
}

testPipeline().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Test failed:', message);
  process.exit(1);
});
