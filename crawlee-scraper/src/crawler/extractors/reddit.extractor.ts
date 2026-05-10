// src/crawler/extractors/reddit.extractor.ts

import type { Page } from 'playwright';
import type { Log } from '@apify/log';
import type { ExtractedLink } from '../../interfaces/extracted-data.interface.js';

/**
 * Extracts resource links from a Reddit thread page.
 *
 * Reddit threads require scrolling to load lazy-loaded comments.
 * We scroll 5 times with 1s delays to ensure most comments are rendered
 * before extracting anchor elements.
 */
export async function extractReddit(page: Page, log: Log): Promise<ExtractedLink[]> {
  log.info('Extracting Reddit links...');

  await page.waitForTimeout(3000);

  // Scroll to trigger lazy-loaded comment sections
  for (let i = 0; i < 5; i++) {
    await page.evaluate(() => window.scrollBy(0, 2000));
    await page.waitForTimeout(1000);
  }

  const links: ExtractedLink[] = await page.$$eval('a[href]', (anchors: HTMLAnchorElement[]) => {
    return anchors.map((a) => ({
      url: a.href,
      title: a.textContent?.trim() ?? '',
      context: a.closest('p, li, div')?.textContent?.trim()?.substring(0, 300) ?? '',
    }));
  });

  return links;
}
