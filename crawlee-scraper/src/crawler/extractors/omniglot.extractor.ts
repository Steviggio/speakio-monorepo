// src/crawler/extractors/omniglot.extractor.ts

import type { Page } from 'playwright';
import type { Log } from '@apify/log';
import type { ExtractedLink } from '../../interfaces/extracted-data.interface.js';

/**
 * Extracts resource links from the Omniglot homepage.
 *
 * Omniglot is an encyclopedia of writing systems. We extract internal links
 * that point to language-specific pages, filtering out news and very short
 * anchor texts (which are typically navigation elements).
 */
export async function extractOmniglot(page: Page, log: Log): Promise<ExtractedLink[]> {
  log.info('Extracting Omniglot links...');

  const allLinks: ExtractedLink[] = await page.$$eval('a[href]', (anchors: HTMLAnchorElement[]) => {
    return anchors.map((a) => ({
      url: a.href,
      title: a.textContent?.trim() ?? '',
      context: a.closest('td, li, p, div')?.textContent?.trim()?.substring(0, 300) ?? '',
    }));
  });

  // Filter to Omniglot internal pages, excluding news and trivial links
  return allLinks.filter((link) => {
    try {
      const url = new URL(link.url);
      return url.hostname.includes('omniglot.com') &&
        !link.url.includes('/news/') &&
        link.title.length > 1;
    } catch {
      return false;
    }
  });
}
