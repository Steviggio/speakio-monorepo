// src/crawler/extractors/openculture.extractor.ts

import type { Page } from 'playwright';
import type { Log } from '@apify/log';
import type { ExtractedLink } from '../../interfaces/extracted-data.interface.js';

/**
 * Extracts resource links from the OpenCulture free language lessons page.
 *
 * OpenCulture has a long-form content page with lazy-loaded sections.
 * We perform progressive scrolling until the page height stabilizes,
 * then try multiple CSS selectors to find the richest content container.
 * Language context is extracted by walking up the DOM to find the nearest heading.
 */
export async function extractOpenCulture(page: Page, log: Log): Promise<ExtractedLink[]> {
  log.info('Extracting OpenCulture links...');

  // Progressive scrolling to trigger all lazy-loaded content
  let prevHeight = 0;
  for (let i = 0; i < 20; i++) {
    await page.evaluate(() => window.scrollBy(0, 3000));
    await page.waitForTimeout(500);
    const currentHeight = await page.evaluate(() => document.body.scrollHeight);
    if (currentHeight === prevHeight) break;
    prevHeight = currentHeight;
  }

  /**
   * Try multiple selectors ordered by specificity.
   * OpenCulture's DOM structure varies, so we attempt the most specific
   * content container first and fall back to broader selectors.
   */
  const selectors = [
    '.entry-content a[href]',
    '.post-content a[href]',
    'article a[href]',
    '.wpb_wrapper a[href]',
    '#content a[href]',
  ];

  let links: ExtractedLink[] = [];

  for (const selector of selectors) {
    const count = await page.$$eval(selector, (els: Element[]) => els.length).catch(() => 0);
    log.info(`Selector "${selector}" matched ${count} elements`);

    // Use the first selector that finds a substantial number of links
    if (count > 10) {
      links = await page.$$eval(selector, (anchors: HTMLAnchorElement[]) => {
        return anchors.map((a) => {
          // Walk up to find the nearest language heading for context
          let langContext = '';
          const parent = a.closest('li, p, ul, div');
          if (parent) {
            let prev: Element | null = parent;
            let attempts = 0;
            while (prev && attempts < 50) {
              prev = prev.previousElementSibling;
              attempts++;
              if (prev && ['H2', 'H3', 'STRONG', 'B', 'H4'].includes(prev.tagName)) {
                langContext = prev.textContent?.trim() ?? '';
                break;
              }
            }
          }
          return {
            url: a.href,
            title: a.textContent?.trim() ?? '',
            context: langContext + ' | ' + (a.closest('li')?.textContent?.trim()?.substring(0, 300) ?? ''),
          };
        });
      });
      break;
    }
  }

  // Fallback: extract from all body links if no specific selector worked
  if (links.length === 0) {
    log.info('No specific selectors matched, falling back to body a[href]');
    links = await page.$$eval('body a[href]', (anchors: HTMLAnchorElement[]) => {
      return anchors.map((a) => {
        let langContext = '';
        const parent = a.closest('li, p, ul, div');
        if (parent) {
          let prev: Element | null = parent;
          let attempts = 0;
          while (prev && attempts < 50) {
            prev = prev.previousElementSibling;
            attempts++;
            if (prev && ['H2', 'H3', 'STRONG', 'B', 'H4'].includes(prev.tagName)) {
              langContext = prev.textContent?.trim() ?? '';
              break;
            }
          }
        }
        return {
          url: a.href,
          title: a.textContent?.trim() ?? '',
          context: langContext + ' | ' + (a.closest('li')?.textContent?.trim()?.substring(0, 300) ?? ''),
        };
      });
    });
  }

  log.info(`Total OpenCulture links extracted: ${links.length}`);
  return links;
}
