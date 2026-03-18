export enum ResourceType {
  BOOK = 'BOOK',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  APP = 'APP',
  CHAT = 'CHAT',
  ARTICLE = 'ARTICLE',
  WEBSITE = 'WEBSITE',
}

export enum Pricing {
  FREE = 'FREE',
  FREEMIUM = 'FREEMIUM',
  PREMIUM = 'PREMIUM',
}

export enum ResourceStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED'
}

export enum ResourceOrigin {
  MANUAL = 'MANUAL',
  SCRAPING = 'SCRAPING',
  IMPORT = 'IMPORT'
}

export enum ResourceLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

export enum ResourceFormat {
  TEXT = 'TEXT',
  AUDIO = 'AUDIO',
  VIDEO = 'VIDEO',
  INTERACTIVE = 'INTERACTIVE',
  MOBILE = 'MOBILE',
}

/**
 * ISO 639-1 Language Codes.
 * Example: 'en', 'fr', 'es', 'de'.
 */
export type LanguageCode = string;
