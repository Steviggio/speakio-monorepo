// src/main.ts

/**
 * Entry point for the TypeScript Crawlee scraper.
 *
 * Wires all services together and orchestrates the full pipeline:
 * 1. Initialize the pricing pipeline with UrlHeuristic → DomAnalysis strategies.
 * 2. Crawl each curation source sequentially.
 * 3. Merge and deduplicate resources globally.
 * 4. Group by origin (DNS domain / submittedBy).
 * 5. Save the normalized, grouped output to Crawlee Dataset and JSON file.
 */

import fs from 'fs';
import path from 'path';
import { SOURCES } from './config/sources.js';
import { UrlHeuristicStrategy } from './services/pricing/url-heuristic.strategy.js';
import { DomAnalysisStrategy } from './services/pricing/dom-analysis.strategy.js';
import { PricingPipelineService } from './services/pricing/pricing-pipeline.service.js';
import { OriginGrouperService } from './services/grouping/origin-grouper.service.js';
import { crawlSource, mergeResources, saveToDataset } from './crawler/resource-crawler.js';
import type { ExtractedResource } from './interfaces/extracted-data.interface.js';

async function main(): Promise<void> {
  console.log('=== TypeScript Crawlee Scraper ===\n');
  console.log(`Processing ${SOURCES.length} curation sources...\n`);

  /**
   * Assemble the pricing pipeline using the Strategy Pattern.
   * Order matters: UrlHeuristic runs first (fast, cheap), DomAnalysis runs second
   * (more accurate, overrides URL-only guesses on confidence ties).
   * Adding a new strategy (e.g., LLM-based) is a one-line addition here.
   */
  const pricingPipeline = new PricingPipelineService([
    new UrlHeuristicStrategy(),
    new DomAnalysisStrategy(),
  ]);

  const originGrouper = new OriginGrouperService();

  // Ensure output directory exists
  const outputDir = path.join(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Crawl each source sequentially, collecting per-source results
  const allSourceResults: ExtractedResource[][] = [];

  for (const source of SOURCES) {
    console.log(`\n--- Processing: ${source.name} (${source.url}) ---`);

    const resources = await crawlSource(source, pricingPipeline);
    console.log(`  → ${resources.length} unique resources extracted from ${source.name}`);

    // Save per-source output for debugging
    const sourceFile = path.join(outputDir, `${source.name}.json`);
    fs.writeFileSync(sourceFile, JSON.stringify(resources, null, 2));
    console.log(`  → Saved to ${sourceFile}`);

    allSourceResults.push(resources);
  }

  // Global merge and deduplication across all sources
  console.log('\n=== Post-Processing ===');
  const mergedResources = mergeResources(allSourceResults);
  console.log(`Total unique resources after global dedup: ${mergedResources.length}`);

  // Group by origin (DNS domain / submittedBy)
  const groupedOutput = originGrouper.group(mergedResources);
  console.log(`Total origin groups: ${groupedOutput.totalOrigins}`);

  // Save grouped output to JSON file
  const groupedFile = path.join(outputDir, 'grouped_resources.json');
  fs.writeFileSync(groupedFile, JSON.stringify(groupedOutput, null, 2));
  console.log(`\n✅ Grouped output saved to: ${groupedFile}`);

  // Save to Crawlee Dataset for potential downstream pipeline integration
  try {
    await saveToDataset(groupedOutput as unknown as Record<string, unknown>);
    console.log('✅ Saved to Crawlee Dataset: storage/datasets/grouped-resources/');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`⚠️  Could not save to Crawlee Dataset: ${message}`);
  }

  // Print summary
  console.log('\n=== Summary ===');
  console.log(`  Resources: ${groupedOutput.totalResources}`);
  console.log(`  Origins:   ${groupedOutput.totalOrigins}`);
  console.log(`  By Pricing:`, JSON.stringify(groupedOutput.summary.byPricing, null, 2));
  console.log(`  By Type:   `, JSON.stringify(groupedOutput.summary.byType, null, 2));

  // Print top 5 origin groups
  console.log('\n--- Top 5 Origin Groups ---');
  for (const origin of groupedOutput.origins.slice(0, 5)) {
    console.log(`  ${origin.originKey}: ${origin.resourceCount} resources`);
  }

  // Save flat resources for backward compatibility with existing scripts
  const flatFile = path.join(outputDir, 'extracted_resources.json');
  fs.writeFileSync(flatFile, JSON.stringify(mergedResources, null, 2));
  console.log(`\n✅ Flat output saved to: ${flatFile}`);

  // Save summary
  const summaryFile = path.join(outputDir, 'extraction_summary.json');
  fs.writeFileSync(summaryFile, JSON.stringify(groupedOutput.summary, null, 2));
  console.log(`📊 Summary saved to: ${summaryFile}`);

  console.log('\n=== Done! ===');
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Fatal error:', message);
  process.exit(1);
});
