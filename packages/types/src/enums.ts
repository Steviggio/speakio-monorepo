export const RESOURCE_TYPES = [
  "BOOK",
  "AUDIO",
  "VIDEO",
  "APP",
  "CHAT",
  "ARTICLE",
  "WEBSITE",
] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const PRICING_VALUES = ["FREE", "FREEMIUM", "PREMIUM"] as const;
export type Pricing = (typeof PRICING_VALUES)[number];

export const RESOURCE_STATUSES = [
  "DRAFT",
  "REVIEW",
  "PUBLISHED",
  "ARCHIVED",
] as const;
export type ResourceStatus = (typeof RESOURCE_STATUSES)[number];

export const RESOURCE_ORIGINS = ["MANUAL", "SCRAPING", "IMPORT"] as const;
export type ResourceOrigin = (typeof RESOURCE_ORIGINS)[number];

export const RESOURCE_LEVELS = [
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
] as const;
export type ResourceLevel = (typeof RESOURCE_LEVELS)[number];

export const RESOURCE_FORMATS = [
  "TEXT",
  "AUDIO",
  "VIDEO",
  "INTERACTIVE",
  "MOBILE",
] as const;
export type ResourceFormat = (typeof RESOURCE_FORMATS)[number];

export const DESCRIPTION_SOURCES = [
  "SCRAPED",
  "META",
  "OG",
  "TWITTER",
  "JSONLD",
  "CONTENT",
  "LLM_REWRITE",
  "MANUAL",
] as const;
export type DescriptionSource = (typeof DESCRIPTION_SOURCES)[number];

export const NORMALIZATION_STATUSES = [
  "RAW",
  "NORMALIZED",
  "ENRICHED",
  "REVIEW",
  "PUBLISHED",
  "REJECTED",
] as const;
export type NormalizationStatus = (typeof NORMALIZATION_STATUSES)[number];

export type LanguageCode = string;
