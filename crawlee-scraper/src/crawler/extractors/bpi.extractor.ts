// src/crawler/extractors/bpi.extractor.ts

import type { Page } from 'playwright';
import type { Log } from '@apify/log';
import type { ExtractedLink } from '../../interfaces/extracted-data.interface.js';

/**
 * Extracts resource links from the BPI language learning selection page.
 *
 * The BPI page uses accordion panels that hide content by default.
 * We click all toggle buttons first to reveal the full list of resources
 * before extracting links from the expanded sections.
 */
export async function extractBPI(page: Page, log: Log): Promise<ExtractedLink[]> {
  log.info('Extracting BPI links...');

  // Expand all accordion sections to reveal hidden resource links
  const toggleButtons = await page.$$('[data-accordion-trigger], .accordion__trigger, button[aria-expanded]');
  for (const btn of toggleButtons) {
    try {
      await btn.click();
      await page.waitForTimeout(300);
    } catch {
      // Some buttons may not be interactive — ignore and continue
    }
  }

  await page.waitForTimeout(1000);

  const links: ExtractedLink[] = await page.$$eval(
    'article a[href], .entry-content a[href], .post-content a[href], main a[href]',
    (anchors: HTMLAnchorElement[]) => {
      return anchors.map((a) => {
        let sectionTitle = '';

        // Walk up the DOM to find the nearest section heading for context
        const section = a.closest('h2, h3, [class*="accordion"]');
        if (!section) {
          let el: HTMLElement | null = a;
          while (el?.parentElement) {
            el = el.parentElement;
            const heading = el.querySelector('h2, h3');
            if (heading) {
              sectionTitle = heading.textContent?.trim() ?? '';
              break;
            }
          }
        } else {
          sectionTitle = section.textContent?.trim() ?? '';
        }

        return {
          url: a.href,
          title: a.textContent?.trim() ?? '',
          context: sectionTitle + ' ' + (a.parentElement?.textContent?.trim()?.substring(0, 300) ?? ''),
        };
      });
    }
  );

  return links;
}
