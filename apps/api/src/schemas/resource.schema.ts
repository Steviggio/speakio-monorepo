import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ResourceType, Pricing } from '@repo/types';
import type { LanguageCode } from '@repo/types';

export type ResourceDocument = Resource & Document;

@Schema({ timestamps: true })
export class Resource {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  url: string;

  @Prop({ required: true, enum: ResourceType })
  type: ResourceType;

  @Prop({ required: true })
  language: LanguageCode;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true, enum: Pricing, default: Pricing.FREE })
  pricing: Pricing;

  @Prop({ required: false })
  imageUrl?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  submittedBy: Types.ObjectId;

  @Prop({ default: 0 })
  positiveVotes: number;

  @Prop({ default: 0 })
  negativeVotes: number;
}

export const ResourceSchema = SchemaFactory.createForClass(Resource);

// Text index for search
ResourceSchema.index({ title: 'text', description: 'text', tags: 'text' });
