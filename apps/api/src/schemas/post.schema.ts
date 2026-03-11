import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ required: true })
  content: string; // Markdown content

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  author: Types.ObjectId;

  @Prop({ required: true, default: 'en' })
  language: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ required: true, enum: ['draft', 'published'], default: 'draft' })
  status: 'draft' | 'published';

  @Prop({ required: false })
  coverImageUrl?: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// Text index for search
PostSchema.index({ title: 'text', content: 'text', tags: 'text' });
