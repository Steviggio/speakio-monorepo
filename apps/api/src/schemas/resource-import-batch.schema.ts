import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ResourceImportBatchDocument =
  HydratedDocument<ResourceImportBatch>;

@Schema({ timestamps: true })
export class ResourceImportBatch {
  @Prop({ type: String, required: true })
  source: string;

  @Prop({ type: String, required: true })
  fileName: string;

  @Prop({ type: String, required: true, index: true })
  language: string;

  @Prop({ type: String, required: true })
  importedBy: string;

  @Prop({
    type: {
      total: { type: Number, default: 0 },
      created: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      rejected: { type: Number, default: 0 },
    },
    default: {},
  })
  stats: {
    total: number;
    created: number;
    updated: number;
    rejected: number;
  };
}

export const ResourceImportBatchSchema =
  SchemaFactory.createForClass(ResourceImportBatch);