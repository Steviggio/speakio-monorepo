import { ResourceType, Pricing, ResourceFormat, ResourceLevel, ResourceOrigin, ResourceStatus } from './enums';

export interface ResourceProvider {
  name: string;
  domain: string;
  baseUrl: string;
}

export interface ResourceSourceMetadata {
  origin: ResourceOrigin;
  importBatchId?: string | null;
  rawFileName?: string | null;
  rawTitle?: string | null;
}

export interface Resource {
  _id: string;
  title: string;
  description: string;
  url: string;
  canonicalUrl: string;

  type: ResourceType;
  language: string;
  tags: string[];
  pricing: Pricing;

  submittedBy?: string | null;
  positiveVotes: number;
  negativeVotes: number;

  provider?: ResourceProvider;
  levels?: ResourceLevel[];
  formats?: ResourceFormat[];

  status: ResourceStatus;
  isActive: boolean;
  sourceMetadata: ResourceSourceMetadata;

  thumbnailUrl?: string | null;
  authorOrPublisher?: string | null;

  createdAt: string;
  updatedAt: string;
}


export type CreateResourceDto = Omit<Resource, '_id' | 'createdAt' | 'updatedAt' | 'positiveVotes' | 'negativeVotes'>;
