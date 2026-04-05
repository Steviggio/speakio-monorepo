import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CommentDocument = Comment & Document;

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: ['Resource', 'Post'] })
  targetType: 'Resource' | 'Post';

  @Prop({ type: Types.ObjectId, required: true, refPath: 'targetType' })
  targetId: Types.ObjectId;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
