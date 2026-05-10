// src/crawler/extractors/languagesgulper.extractor.ts

import type { Page } from 'playwright';
import type { Log } from '@apify/log';
import type { ExtractedLink } from '../../interfaces/extracted-data.interface.js';

/**
 * Extracts resource links from the LanguagesGulper homepage.
 *
 * LanguagesGulper is an informational site about world languages.
 * We extract internal links with meaningful titles, filtering out
 * trivial one-character navigation links.
 */
export async function extractLanguagesGulper(page: Page, log: Log): Promise<ExtractedLink[]> {
  log.info('Extracting LanguagesGulper links...');

  const allLinks: ExtractedLink[] = await page.$$eval('a[href]', (anchors: HTMLAnchorElement[]) => {
    return anchors.map((a) => ({
      url: a.href,
      title: a.textContent?.trim() ?? '',
      context: a.closest('td, li, p, div')?.textContent?.trim()?.substring(0, 300) ?? '',
    }));
  });

  // Filter to LanguagesGulper internal pages with meaningful titles
  return allLinks.filter((link) => {
    try {
      const url = new URL(link.url);
      return url.hostname.includes('languagesgulper.com') && link.title.length > 1;
    } catch {
      return false;
    }
  });
}
