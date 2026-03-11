import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class VocabularyItem {
  @Prop({ required: true })
  front: string;

  @Prop({ required: true })
  back: string;
}

export class RoadmapSubStep {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ required: false })
  completedAt?: Date;

  @Prop({ required: false })
  deadline?: Date;

  @Prop({ type: [VocabularyItem], default: [] })
  vocabularies: VocabularyItem[];
}

export class RoadmapStep {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ default: false })
  completed: boolean;

  @Prop({ required: false })
  completedAt?: Date;

  @Prop({ required: false })
  deadline?: Date;

  @Prop({ type: [VocabularyItem], default: [] })
  vocabularies: VocabularyItem[];

  @Prop({ type: [RoadmapSubStep], default: [] })
  subSteps: RoadmapSubStep[];
}

export type RoadmapDocument = Roadmap & Document;

@Schema({ timestamps: true })
export class Roadmap {
  @Prop({ required: true })
  title: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;

  @Prop({ required: true, default: 'en' })
  language: string;

  @Prop({ required: false })
  deadline?: Date;

  @Prop({ type: [RoadmapStep], default: [] })
  steps: RoadmapStep[];
}

export const RoadmapSchema = SchemaFactory.createForClass(Roadmap);
