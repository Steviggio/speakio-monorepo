import type {
  Pricing,
  ResourceFormat,
  ResourceLevel,
  ResourceOrigin,
  ResourceStatus,
  ResourceType,
} from '@repo/types';

export interface ResourceCandidateInput {
  url: string;
  title?: string;
  description?: string;
  type?: string;
  language?: string;
  pricing?: string;
  tags?: string[];
  levels?: ResourceLevel[];
  formats?: ResourceFormat[];
  publisher?: { slug?: string | null; name?: string | null } | null;
  series?: { slug?: string | null; name?: string | null } | null;
  status?: ResourceStatus;
  isActive?: boolean;
  metadata: {
    origin: ResourceOrigin; // 'MANUAL' | 'SCRAPING' | 'IMPORT'
    source?: string;
    importBatchId?: string | null;
    rawFileName?: string | null;
    submittedBy?: string | null;
  };
  existing?: {
    status?: ResourceStatus | null;
    isActive?: boolean;
  };
}

export interface CuratedResourceOutput {
  title: string;
  description: string;
  url: string;
  canonicalUrl: string;
  type: ResourceType;
  language: string;
  pricing: Pricing;
  tags: string[];
  levels: ResourceLevel[];
  formats: ResourceFormat[];
  sourcePlatform: {
    domain: string;
    rootDomain: string;
    baseUrl: string;
    label: string;
  };
  publisher: { slug: string; name: string } | null;
  series: { slug: string; name: string } | null;
  status: ResourceStatus;
  isActive: boolean;
  sourceMetadata: {
    origin: ResourceOrigin;
    importBatchId?: string | null;
    rawFileName?: string | null;
    rawTitle?: string | null;
  };
  thumbnailUrl: string | null;
  authorOrPublisher: string | null;
  quality: {
    score: number;
    descriptionScore: number;
    normalizationStatus: string;
    descriptionSource: string;
    flags: string[];
    reviewReasons: string[];
    duplicateOf: string | null;
    isPublishable: boolean;
    lastNormalizedAt: Date;
  };
  raw?: Record<string, unknown> | null;
  enrichment?: Record<string, unknown> | null;
}
