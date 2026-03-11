import { ResourceType, LanguageCode, Pricing } from './enums';

export interface Resource {
  _id: string;
  title: string;
  description: string;
  url: string;
  type: ResourceType;
  language: LanguageCode;
  tags: string[];
  pricing: Pricing;
  imageUrl?: string;
  submittedBy: string;
  positiveVotes: number;
  negativeVotes: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateResourceDto = Omit<Resource, '_id' | 'createdAt' | 'updatedAt' | 'positiveVotes' | 'negativeVotes'>;
