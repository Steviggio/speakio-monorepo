// src/crawler/extractors/fsi.extractor.ts

import type { Page } from 'playwright';
import type { Log } from '@apify/log';
import type { ExtractedLink } from '../../interfaces/extracted-data.interface.js';

/**
 * Extracts resource links from the FSI Languages directory listing.
 *
 * The FSI archive is a simple Apache-style directory listing.
 * We filter for links that point to language course directories
 * (ending with '/' or '.html') and exclude directory listing metadata
 * headers ('Name', 'Last modified', 'Size', etc.).
 */
export async function extractFSI(page: Page, log: Log): Promise<ExtractedLink[]> {
  log.info('Extracting FSI links...');

  const allLinks: ExtractedLink[] = await page.$$eval('a[href]', (anchors: HTMLAnchorElement[]) => {
    return anchors.map((a) => ({
      url: a.href,
      title: a.textContent?.trim() ?? '',
      context: 'FSI - Foreign Service Institute language course',
    }));
  });

  // Filter to language course paths only, excluding directory listing UI elements
  return allLinks.filter((link) => {
    try {
      const url = new URL(link.url);
      return url.pathname.includes('/languages/') &&
        (url.pathname.endsWith('/') || url.pathname.endsWith('.html'));
    } catch {
      return false;
    }
  });
}
