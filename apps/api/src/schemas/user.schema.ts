import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ResourceDocument } from './resource.schema';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: false })
  passwordHash?: string;

  @Prop({ required: false, unique: true, sparse: true })
  googleId?: string;

  @Prop({ required: false })
  bio?: string;

  @Prop({ required: false })
  avatarUrl?: string;

  @Prop({ required: true, enum: ['USER', 'ADMIN'], default: 'USER' })
  role: string;

  @Prop({ required: true, default: 'en' })
  locale: string;

  @Prop({ type: [String], default: [] })
  learningLanguages: string[];

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Resource' }], default: [] })
  favoriteResources: Types.ObjectId[] | ResourceDocument[];

  @Prop({ required: false })
  resetPasswordToken?: string;

  @Prop({ required: false })
  resetPasswordExpires?: Date;

  @Prop({ required: false })
  consentGivenAt?: Date;

  @Prop({ required: false })
  consentVersion?: string;

  @Prop({ required: false })
  deletedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
