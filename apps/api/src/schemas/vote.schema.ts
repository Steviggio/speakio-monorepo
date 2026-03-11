import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VoteDocument = Vote & Document;

@Schema({ timestamps: true })
export class Vote {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Resource', required: true })
  resource: Types.ObjectId;

  @Prop({ required: true, enum: ['positive', 'negative'] })
  type: 'positive' | 'negative';
}

export const VoteSchema = SchemaFactory.createForClass(Vote);

// Ensure one vote per user per resource
VoteSchema.index({ user: 1, resource: 1 }, { unique: true });
