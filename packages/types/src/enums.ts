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

/**
 * ISO 639-1 Language Codes.
 * Example: 'en', 'fr', 'es', 'de'.
 */
export type LanguageCode = string;
