// src/config/sources.ts

/**
 * Defines a single curation source page to crawl.
 * Each source has a dedicated extractor that understands its DOM structure.
 */
export interface CurationSource {
  /** The URL to crawl for resource links. */
  readonly url: string;
  /** Machine-readable name used to look up the correct extractor. */
  readonly name: string;
  /** Human-readable description of what this source provides. */
  readonly description: string;
}

/**
 * Registry of all curation source pages the scraper knows how to process.
 * Each entry maps to a specific extractor in the extractor registry.
 *
 * Why hardcoded: These are editorial decisions about which sources to trust.
 * In production, this could be driven by a database or config file.
 */
export const SOURCES: ReadonlyArray<CurationSource> = [
  {
    url: 'https://www.reddit.com/r/languagelearning/comments/1csr4qy/what_are_the_best_resources_available_online_free/',
    name: 'reddit_languagelearning',
    description: 'Reddit thread listing the best free/paid online language learning resources.',
  },
  {
    url: 'https://www.bpi.fr/notre-selection-de-sites-pour-se-former-aux-langues/',
    name: 'bpi_selection_langues',
    description: 'BPI curated selection of language learning websites.',
  },
  {
    url: 'https://fsi-languages.yojik.eu/languages/oldfsi/languages/',
    name: 'fsi_languages',
    description: 'Archive of Foreign Service Institute audio and text language courses.',
  },
  {
    url: 'https://www.openculture.com/freelanguagelessons',
    name: 'openculture_languages',
    description: 'Directory of free language lessons for 45+ languages.',
  },
  {
    url: 'https://www.omniglot.com/',
    name: 'omniglot',
    description: 'Online encyclopedia of writing systems and world languages.',
  },
  {
    url: 'https://www.languagesgulper.com/eng/Home.html',
    name: 'languagesgulper',
    description: 'Informational site on world languages, their structures and characteristics.',
  },
] as const;
