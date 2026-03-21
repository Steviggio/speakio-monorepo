import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {
  PRICING_VALUES,
  RESOURCE_FORMATS,
  RESOURCE_LEVELS,
  RESOURCE_ORIGINS,
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  DESCRIPTION_SOURCES,
  NORMALIZATION_STATUSES,
  type Pricing,
  type ResourceFormat,
  type ResourceLevel,
  type ResourceOrigin,
  type ResourceStatus,
  type ResourceType,
  type DescriptionSource,
  type NormalizationStatus,
} from '@repo/types';

export type ResourceDocument = HydratedDocument<Resource>;

@Schema({ _id: false })
export class SourcePlatform {
  @Prop({ type: String, required: true, index: true })
  domain: string;

  @Prop({ type: String, required: true, index: true })
  rootDomain: string;

  @Prop({ type: String, required: true })
  baseUrl: string;

  @Prop({ type: String, required: true })
  label: string;
}

@Schema({ _id: false })
export class PublisherRef {
  @Prop({ type: String, default: null, index: true })
  slug?: string | null;

  @Prop({ type: String, default: null })
  name?: string | null;
}

@Schema({ _id: false })
export class SeriesRef {
  @Prop({ type: String, default: null, index: true })
  slug?: string | null;

  @Prop({ type: String, default: null })
  name?: string | null;
}

@Schema({ _id: false })
export class ResourceSourceMetadata {
  @Prop({ type: String, enum: RESOURCE_ORIGINS, default: 'MANUAL' })
  origin: ResourceOrigin;

  @Prop({ type: String, default: null })
  importBatchId?: string | null;

  @Prop({ type: String, default: null })
  rawFileName?: string | null;

  @Prop({ type: String, default: null })
  rawTitle?: string | null;
}

@Schema({ _id: false })
export class RawResourceData {
  @Prop({ type: String, default: null, index: true })
  sourceName?: string | null;

  @Prop({ type: String, default: null })
  sourcePageUrl?: string | null;

  @Prop({ type: Date, default: null })
  scrapedAt?: Date | null;

  @Prop({ type: String, default: null })
  scraperVersion?: string | null;

  @Prop({ type: String, default: null })
  title?: string | null;

  @Prop({ type: String, default: null })
  description?: string | null;

  @Prop({ type: String, default: null })
  url?: string | null;

  @Prop({ type: String, default: null })
  language?: string | null;

  @Prop({ type: String, default: null })
  type?: string | null;

  @Prop({ type: String, default: null })
  pricing?: string | null;

  @Prop({ type: [String], default: [] })
  tags?: string[];
}

@Schema({ _id: false })
export class ResourceEnrichment {
  @Prop({ type: String, default: null })
  resolvedUrl?: string | null;

  @Prop({ type: String, default: null })
  finalUrl?: string | null;

  @Prop({ type: Date, default: null })
  fetchedAt?: Date | null;

  @Prop({ type: Number, default: null })
  httpStatus?: number | null;

  @Prop({ type: String, default: null })
  htmlTitle?: string | null;

  @Prop({ type: String, default: null })
  metaDescription?: string | null;

  @Prop({ type: String, default: null })
  ogTitle?: string | null;

  @Prop({ type: String, default: null })
  ogDescription?: string | null;

  @Prop({ type: String, default: null })
  twitterTitle?: string | null;

  @Prop({ type: String, default: null })
  twitterDescription?: string | null;

  @Prop({ type: String, default: null })
  jsonLdTitle?: string | null;

  @Prop({ type: String, default: null })
  jsonLdDescription?: string | null;

  @Prop({ type: String, default: null })
  extractedFirstParagraph?: string | null;

  @Prop({ type: String, default: null })
  extractedAuthor?: string | null;

  @Prop({ type: String, default: null })
  extractedPublisher?: string | null;

  @Prop({ type: String, default: null })
  pageLanguage?: string | null;
}

@Schema({ _id: false })
export class ResourceQuality {
  @Prop({ type: Number, default: 0, min: 0, max: 100, index: true })
  score: number;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  descriptionScore: number;

  @Prop({
    type: String,
    enum: NORMALIZATION_STATUSES,
    default: 'RAW',
    index: true,
  })
  normalizationStatus: NormalizationStatus;

  @Prop({
    type: String,
    enum: DESCRIPTION_SOURCES,
    default: 'SCRAPED',
  })
  descriptionSource: DescriptionSource;

  @Prop({ type: [String], default: [] })
  flags: string[];

  @Prop({ type: [String], default: [] })
  reviewReasons: string[];

  @Prop({ type: Types.ObjectId, ref: 'Resource', default: null })
  duplicateOf?: Types.ObjectId | null;

  @Prop({ type: Boolean, default: false, index: true })
  isPublishable: boolean;

  @Prop({ type: Date, default: null })
  lastNormalizedAt?: Date | null;
}

@Schema({ timestamps: true })
export class Resource {
  @Prop({ type: String, required: true, trim: true, index: true })
  title: string;

  @Prop({ type: String, required: true, trim: true })
  description: string;

  @Prop({ type: String, required: true, trim: true })
  url: string;

  @Prop({ type: String, trim: true, index: true, default: '' })
  canonicalUrl: string;

  @Prop({ type: String, enum: RESOURCE_TYPES, required: true, index: true })
  type: ResourceType;

  @Prop({ type: String, required: true, index: true })
  language: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({
    type: String,
    enum: PRICING_VALUES,
    required: true,
    default: 'FREE',
    index: true,
  })
  pricing: Pricing;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  submittedBy?: Types.ObjectId | null;

  @Prop({ type: Number, default: 0 })
  positiveVotes: number;

  @Prop({ type: Number, default: 0 })
  negativeVotes: number;

  @Prop({ type: SourcePlatform, default: null })
  sourcePlatform?: SourcePlatform | null;

  @Prop({ type: PublisherRef, default: null })
  publisher?: PublisherRef | null;

  @Prop({ type: SeriesRef, default: null })
  series?: SeriesRef | null;

  @Prop({ type: [String], enum: RESOURCE_LEVELS, default: [] })
  levels?: ResourceLevel[];

  @Prop({ type: [String], enum: RESOURCE_FORMATS, default: [] })
  formats?: ResourceFormat[];

  @Prop({
    type: String,
    enum: RESOURCE_STATUSES,
    default: 'REVIEW',
    index: true,
  })
  status: ResourceStatus;

  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @Prop({
    type: ResourceSourceMetadata,
    default: () => ({ origin: 'MANUAL' }),
  })
  sourceMetadata?: ResourceSourceMetadata;

  @Prop({ type: String, default: null })
  thumbnailUrl?: string | null;

  @Prop({ type: String, default: null })
  authorOrPublisher?: string | null;

  @Prop({ type: RawResourceData, default: null })
  raw?: RawResourceData | null;

  @Prop({ type: ResourceEnrichment, default: null })
  enrichment?: ResourceEnrichment | null;

  @Prop({
    type: ResourceQuality,
    default: () => ({
      score: 0,
      descriptionScore: 0,
      normalizationStatus: 'RAW',
      descriptionSource: 'SCRAPED',
      flags: [],
      reviewReasons: [],
      duplicateOf: null,
      isPublishable: false,
      lastNormalizedAt: null,
    }),
  })
  quality: ResourceQuality;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);

ResourceSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text',
  'publisher.name': 'text',
  'series.name': 'text',
  'raw.title': 'text',
  'raw.description': 'text',
  'enrichment.metaDescription': "text",
  'enrichment.ogDescription': 'text',
});

ResourceSchema.index({ language: 1, type: 1, status: 1, isActive: 1 });
ResourceSchema.index({ language: 1, pricing: 1, status: 1, isActive: 1 });
ResourceSchema.index({ 'sourcePlatform.rootDomain': 1, status: 1, isActive: 1 });
ResourceSchema.index({ 'sourcePlatform.domain': 1, status: 1, isActive: 1 });
ResourceSchema.index({ 'publisher.slug': 1, status: 1, isActive: 1 });
ResourceSchema.index({ 'series.slug': 1, status: 1, isActive: 1 });

ResourceSchema.index({ canonicalUrl: 1 }, { unique: true });
ResourceSchema.index({ 'quality.score': -1 });
ResourceSchema.index({ 'quality.normalizationStatus': 1, status: 1 });
ResourceSchema.index({ 'quality.isPublishable': 1, status: 1 });
ResourceSchema.index({ 'raw.sourceName': 1, language: 1 });
ResourceSchema.index({ 'sourceMetadata.importBatchId': 1 });